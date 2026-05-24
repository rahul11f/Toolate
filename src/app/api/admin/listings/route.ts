import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role, ListingCategory, ListingStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as ListingStatus | null;
    const category = searchParams.get('category') as ListingCategory | null;

    const where: any = {};
    if (status && Object.values(ListingStatus).includes(status)) {
      where.status = status;
    }
    if (category && Object.values(ListingCategory).includes(category)) {
      where.category = category;
    }

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const parsedListings = listings.map(l => ({
      ...l,
      images: typeof l.images === 'string' ? JSON.parse(l.images) : l.images
    }));

    return NextResponse.json(parsedListings);
  } catch (error: any) {
    console.error('Error fetching admin listings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
