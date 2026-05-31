import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ListingStatus, ListingCategory } from '@/lib/types';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await props.params;

    // 1. Verify user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // 2. Fetch the listing to verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true, category: true, isSharedHotelRoom: true, checkOutDate: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    if (listing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden. You do not own this listing.' }, { status: 403 });
    }

    // 3. Renew the listing: reset expiresAt to checkOutDate or 60 days from now, and set status to PENDING
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        expiresAt: listing.checkOutDate
          ? new Date(listing.checkOutDate)
          : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days default
        status: ListingStatus.PENDING, // Reset to pending for admin re-approval
      } as any,
    });

    return NextResponse.json({
      success: true,
      message: 'Listing renewed successfully! It is now pending admin re-approval.',
      listing: updatedListing,
    });
  } catch (error: any) {
    console.error('Error renewing listing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
