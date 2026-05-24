import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, ListingStatus } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const adminId = (session.user as any).id;

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.APPROVED },
    });

    // Write audit log
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'APPROVE_LISTING',
        targetType: 'LISTING',
        targetId: id,
        details: `Approved listing: "${updatedListing.title}"`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Listing approved successfully.',
      listing: updatedListing,
    });
  } catch (error: any) {
    console.error('Error approving listing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
