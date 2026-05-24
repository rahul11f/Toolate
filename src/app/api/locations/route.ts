import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ListingStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: ListingStatus.APPROVED },
      select: {
        state: true,
        city: true,
      },
    });

    const states = Array.from(new Set(listings.map((l) => l.state).filter(Boolean))).sort();
    const cities = Array.from(new Set(listings.map((l) => l.city).filter(Boolean))).sort();

    return NextResponse.json({ states, cities });
  } catch (error: any) {
    console.error('Locations API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch locations.' },
      { status: 500 }
    );
  }
}
