import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, ListingStatus } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.PENDING },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: 'REVIEW_LISTING_AGAIN',
        targetType: 'LISTING',
        targetId: id,
        details: `Re-queued listing ${id} for moderation`,
      },
    });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error: any) {
    console.error('Error queuing for review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
