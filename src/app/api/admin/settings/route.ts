import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET settings (publicly accessible, but falls back to default if not seeded)
export async function GET() {
  try {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Failed to get site settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve site settings.' },
      { status: 500 }
    );
  }
}

// PUT settings (restricted to ADMINs)
export async function PUT(req: NextRequest) {
  try {
    // Check authentication and role
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      heroTitle,
      heroSubtitle,
      footerText,
      metaTitle,
      metaDescription,
      adsenseId,
      maintenanceMode,
      helpEmail,
      supportEmail,
      officeAddress,
      supportPhone,
      whatsappSupport,
    } = body;

    const updated = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: {
        heroTitle: heroTitle !== undefined ? heroTitle : undefined,
        heroSubtitle: heroSubtitle !== undefined ? heroSubtitle : undefined,
        footerText: footerText !== undefined ? footerText : undefined,
        metaTitle: metaTitle !== undefined ? metaTitle : undefined,
        metaDescription: metaDescription !== undefined ? metaDescription : undefined,
        adsenseId: adsenseId !== undefined ? adsenseId : undefined,
        maintenanceMode: maintenanceMode !== undefined ? maintenanceMode : undefined,
        helpEmail: helpEmail !== undefined ? helpEmail : undefined,
        supportEmail: supportEmail !== undefined ? supportEmail : undefined,
        officeAddress: officeAddress !== undefined ? officeAddress : undefined,
        supportPhone: supportPhone !== undefined ? supportPhone : undefined,
        whatsappSupport: whatsappSupport !== undefined ? whatsappSupport : undefined,
      },
      create: {
        id: 'default',
        heroTitle: heroTitle || undefined,
        heroSubtitle: heroSubtitle || undefined,
        footerText: footerText || undefined,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        adsenseId: adsenseId || '',
        maintenanceMode: !!maintenanceMode,
        helpEmail: helpEmail || undefined,
        supportEmail: supportEmail || undefined,
        officeAddress: officeAddress || undefined,
        supportPhone: supportPhone || undefined,
        whatsappSupport: whatsappSupport || undefined,
      },
    });

    // Log admin settings change
    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: 'UPDATE_SETTINGS',
        targetType: 'SYSTEM',
        targetId: 'default',
        details: 'Admin updated site settings config.',
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Failed to update site settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update site settings.' },
      { status: 500 }
    );
  }
}
