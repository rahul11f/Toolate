import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ListingStatus } from '@/lib/types';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const CACHE_KEY = 'locations:distinct';

export async function GET() {
  try {
    // 1. Try to read from Cache first
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
      }
    } catch (redisErr) {
      console.warn('[Redis Warning] Failed to read locations cache:', redisErr);
    }

    // 2. Fetch distinct combinations using Prisma's database-level filtering
    const listings = await prisma.listing.findMany({
      where: { status: ListingStatus.APPROVED },
      distinct: ['state', 'city'],
      select: {
        state: true,
        city: true,
      },
    });

    const states = Array.from(new Set(listings.map((l) => l.state).filter(Boolean))).sort();
    const cities = Array.from(new Set(listings.map((l) => l.city).filter(Boolean))).sort();
    const result = { states, cities };

    // 3. Cache findings in Redis for 1 hour
    try {
      await redis.set(CACHE_KEY, JSON.stringify(result), { ex: 3600 });
    } catch (redisErr) {
      console.warn('[Redis Warning] Failed to write locations cache:', redisErr);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Locations API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch locations.' },
      { status: 500 }
    );
  }
}
