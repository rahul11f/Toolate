import { NextRequest, NextResponse } from 'next/server';

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

    // Call OpenStreetMap Nominatim reverse geocoding API. Include User-Agent.
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
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
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in reverse geocode proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
