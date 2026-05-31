import { NextRequest, NextResponse } from 'next/server';
import { getNearbyTransit } from '@/lib/transit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Valid lat and lng are required.' }, { status: 400 });
    }

    const stations = await getNearbyTransit(lat, lng);
    return NextResponse.json(stations);
  } catch (error) {
    console.error('Proximity API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
