import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 });
    }

    const normalizedQuery = q.trim().toLowerCase();
    // Use base64 encoding to keep the Redis cache key clean and safe from special characters
    const cacheKey = `geocode:search:${Buffer.from(normalizedQuery).toString('base64')}`;

    // 1. Try to read from Cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
      }
    } catch (redisErr) {
      console.warn('[Redis Warning] Geocode search cache read failed:', redisErr);
    }

    // 2. Query Nominatim API (OpenStreetMap) with a valid User-Agent
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5`,
      {
        headers: {
          'User-Agent': 'ToolateListingPlatform/1.0 (contact: admin@toolate.com)',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Nominatim service returned an error.' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 3. Cache findings in Redis for 30 days (2592000 seconds)
    try {
      await redis.set(cacheKey, JSON.stringify(data), { ex: 2592000 });
    } catch (redisErr) {
      console.warn('[Redis Warning] Geocode search cache write failed:', redisErr);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in geocode search proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
