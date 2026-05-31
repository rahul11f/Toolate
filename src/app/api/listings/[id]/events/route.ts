import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Retrieve aggregated event analytics for the listing (Owner only)
export async function GET(
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

    // 2. Verify listing ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    if (listing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden. You do not own this listing.' }, { status: 403 });
    }

    // 3. Aggregate totals
    const groupStats = await prisma.listingEvent.groupBy({
      by: ['eventType'],
      where: { listingId },
      _count: { id: true },
    });

    const stats = {
      VIEW: 0,
      INQUIRY: 0,
      SAVE: 0,
      SHARE: 0,
    };

    groupStats.forEach((group) => {
      const type = group.eventType as keyof typeof stats;
      if (stats[type] !== undefined) {
        stats[type] = group._count.id;
      }
    });

    // 4. Fetch daily view counts for the last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailyViewsRaw = await prisma.listingEvent.findMany({
      where: {
        listingId,
        eventType: 'VIEW',
        createdAt: { gte: fourteenDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Map raw timestamps to dates
    const dailyViewsMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyViewsMap[dateStr] = 0;
    }

    dailyViewsRaw.forEach((event) => {
      const dateStr = event.createdAt.toISOString().split('T')[0];
      if (dailyViewsMap[dateStr] !== undefined) {
        dailyViewsMap[dateStr]++;
      }
    });

    const sparklineData = Object.keys(dailyViewsMap).map((date) => ({
      date,
      count: dailyViewsMap[date],
    }));

    return NextResponse.json({
      success: true,
      stats,
      sparkline: sparklineData,
    });
  } catch (error: any) {
    console.error('Error fetching listing analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

// POST: Log a new event (Public/Anonymous)
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await props.params;
    const body = await req.json();
    const { eventType } = body;

    const validTypes = ['VIEW', 'INQUIRY', 'SAVE', 'SHARE'];
    if (!eventType || !validTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type.' }, { status: 400 });
    }

    // Capture User Agent header
    const userAgent = req.headers.get('user-agent');
    
    // Optional: try to resolve city from IP/headers (fallback to null)
    const city = req.headers.get('x-vercel-ip-city') || null;

    // Verify listing exists before creating event
    const listingExists = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });

    if (!listingExists) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    await prisma.listingEvent.create({
      data: {
        listingId,
        eventType,
        userAgent,
        city,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error logging listing event:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
