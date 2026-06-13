import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Parameters "lat" and "lng" are required.' },
        { status: 400 }
      );
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return NextResponse.json(
        { error: 'Parameters "lat" and "lng" must be valid numbers.' },
        { status: 400 }
      );
    }

    // Round coordinates to 4 decimals (~11 meters accuracy) for highly effective caching
    const roundedLat = latNum.toFixed(4);
    const roundedLng = lngNum.toFixed(4);
    const cacheKey = `geocode:reverse:${roundedLat}:${roundedLng}`;

    // 1. Try to read from Cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached);
      }
    } catch (redisErr) {
      console.warn('[Redis Warning] Geocode reverse cache read failed:', redisErr);
    }

    // 2. Query Nominatim reverse geocoder
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ToolateListingPlatform/1.0 (contact: admin@toolate.com)',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Nominatim reverse geocode service returned an error.' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 3. Cache the results in Redis for 30 days (2592000 seconds)
    try {
      await redis.set(cacheKey, JSON.stringify(data), { ex: 2592000 });
    } catch (redisErr) {
      console.warn('[Redis Warning] Geocode reverse cache write failed:', redisErr);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in reverse geocode proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
