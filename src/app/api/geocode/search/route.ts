import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 });
    }

    // Call OpenStreetMap Nominatim search API. Include a descriptive User-Agent.
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
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in geocode search proxy:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
