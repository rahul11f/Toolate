import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST: Request to join/split hotel cost (requires verified ID)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;

    // 1. Fetch user to verify their ID if required
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { documentVerified: true },
    });

    // 2. Fetch the listing
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const isHotelSplit = listing.category === 'HOTEL' && listing.isSharedHotelRoom;
    const isShareStay = listing.category === 'SHARE_STAY';

    if (!isHotelSplit && !isShareStay) {
      return NextResponse.json({ error: 'This listing does not support sharing/splitting.' }, { status: 400 });
    }

    if (listing.userId === userId) {
      return NextResponse.json({ error: 'You cannot request to split/join your own listing.' }, { status: 400 });
    }

    if (listing.hotelSplitStatus !== 'AVAILABLE') {
      return NextResponse.json({ error: 'This share/split stay is no longer available.' }, { status: 400 });
    }

    // Require verification if explicitly specified in the listing OR if it's a HOTEL split
    const needsVerification = listing.requireVerification || isHotelSplit;
    if (needsVerification && (!user || !user.documentVerified)) {
      return NextResponse.json({
        error: 'Security Alert: Only users with a Verified Government ID badge can request to split/join this listing.'
      }, { status: 403 });
    }

    // 3. Update status to REQUESTED
    await prisma.listing.update({
      where: { id },
      data: {
        hotelSplitStatus: 'REQUESTED',
        hotelSplitUserId: userId,
      },
    });

    // Create in-app notification for the listing owner
    await prisma.notification.create({
      data: {
        userId: listing.userId,
        title: isShareStay ? '🤝 Co-stay Interest Expressed' : '🤝 Co-stay Split Requested',
        message: isShareStay
          ? `${session.user.name || 'A traveler'} expressed interest to join your shared stay listing "${listing.title}".`
          : `${session.user.name || 'A traveler'} requested to join and split the stay cost on your listing "${listing.title}".`,
      },
    });

    return NextResponse.json({
      success: true,
      message: isShareStay
        ? 'Interest expressed successfully! Awaiting host confirmation.'
        : 'Co-stay split request submitted successfully! Awaiting owner confirmation.',
    });
  } catch (error: any) {
    console.error('Hotel split POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

// PUT: Lister Accept/Reject the split request
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const body = await req.json();
    const { action } = body; // 'ACCEPT' | 'REJECT'

    if (!action || (action !== 'ACCEPT' && action !== 'REJECT')) {
      return NextResponse.json({ error: 'Invalid action. Must be ACCEPT or REJECT.' }, { status: 400 });
    }

    // 1. Fetch listing to confirm ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    if (listing.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized. Only the lister can manage split requests.' }, { status: 403 });
    }

    if (listing.hotelSplitStatus !== 'REQUESTED' || !listing.hotelSplitUserId) {
      return NextResponse.json({ error: 'No active split requests found for this listing.' }, { status: 400 });
    }

    const isShareStay = listing.category === 'SHARE_STAY';

    // 2. Perform action
    if (action === 'ACCEPT') {
      await prisma.listing.update({
        where: { id },
        data: {
          hotelSplitStatus: 'COMPLETED',
        },
      });

      // Notify the requester
      await prisma.notification.create({
        data: {
          userId: listing.hotelSplitUserId,
          title: isShareStay ? '🎉 Shared Stay Request Approved!' : '🎉 Cost Split Approved!',
          message: isShareStay
            ? `Your interest to join "${listing.title}" was approved by the host. Coordinate directly to organize your stay!`
            : `Your co-stay request for "${listing.title}" was approved by the host. Coordinate directly to finalize travel!`,
        },
      });
    } else {
      const requesterId = listing.hotelSplitUserId;
      await prisma.listing.update({
        where: { id },
        data: {
          hotelSplitStatus: 'AVAILABLE',
          hotelSplitUserId: null,
        },
      });

      // Notify the requester
      await prisma.notification.create({
        data: {
          userId: requesterId,
          title: isShareStay ? '❌ Shared Stay Request Declined' : '❌ Cost Split Declined',
          message: isShareStay
            ? `Your request to join "${listing.title}" was declined by the host.`
            : `Your co-stay request for "${listing.title}" was declined by the host.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Request ${action.toLowerCase()}ed successfully.`,
    });
  } catch (error: any) {
    console.error('Hotel split PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
