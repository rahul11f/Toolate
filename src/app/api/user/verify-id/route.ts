import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { docType, legalName, idNumber, documentUrl } = body;

    if (!docType || !legalName || !idNumber || !documentUrl) {
      return NextResponse.json({ error: 'All validation fields (Document Type, Legal Name, ID Number, and Uploaded Document File) are required.' }, { status: 400 });
    }

    // 1. Fetch user to verify name matches profile name exactly
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const profileNameNormalized = (user.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const docNameNormalized = legalName.toLowerCase().replace(/\s+/g, ' ').trim();

    if (profileNameNormalized !== docNameNormalized) {
      return NextResponse.json({
        error: `Security Alert: Legal name on ID ("${legalName}") does not match your profile display name ("${user.name}"). Please update your profile name first.`
      }, { status: 400 });
    }

    // 2. Enforce duplicate ID check
    const duplicateIdUser = await prisma.user.findFirst({
      where: {
        documentNumber: idNumber,
        documentStatus: 'VERIFIED',
        NOT: { id: userId },
      },
    });

    if (duplicateIdUser) {
      return NextResponse.json({
        error: 'Security Alert: This ID number is already verified under another account. Duplicate identity submissions are blocked for security.'
      }, { status: 400 });
    }

    // 3. Perform mock syntax validations
    if (docType === 'AADHAAR') {
      const isDigits = /^\d{12}$/.test(idNumber);
      if (!isDigits) {
        return NextResponse.json({ error: 'Invalid Aadhaar Number format. Must be exactly 12 numeric digits.' }, { status: 400 });
      }
    } else if (docType === 'PASSPORT') {
      const isPassport = /^[A-Z0-9]{8,9}$/i.test(idNumber);
      if (!isPassport) {
        return NextResponse.json({ error: 'Invalid Passport Number format. Must be 8 to 9 alphanumeric characters.' }, { status: 400 });
      }
    } else if (docType === 'VOTER_ID') {
      const isValidVoter = /^[A-Z]{3}\d{7}$/i.test(idNumber);
      if (!isValidVoter) {
        return NextResponse.json({ error: 'Invalid Voter ID format. Must match standard EPIC format (e.g. ABC1234567).' }, { status: 400 });
      }
    }

    // Update database status with metadata
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        documentVerified: true,
        documentStatus: 'VERIFIED',
        documentType: docType,
        legalName: legalName,
        documentNumber: idNumber,
        documentUrl: documentUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ID document verified successfully!',
      documentVerified: updatedUser.documentVerified,
      documentStatus: updatedUser.documentStatus,
    });
  } catch (error: any) {
    console.error('ID Verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        documentVerified: false,
        documentStatus: 'UNVERIFIED',
        documentType: null,
        legalName: null,
        documentNumber: null,
        documentUrl: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Identity verification status reset successfully.',
    });
  } catch (error: any) {
    console.error('ID verification reset error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
