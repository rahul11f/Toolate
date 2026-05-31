import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { origin, destinations, mode } = await req.json();

    if (!origin || !origin.lat || !origin.lng || !destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return NextResponse.json({ error: 'Origin and destinations are required.' }, { status: 400 });
    }

    const travelMode = mode || 'driving'; // 'driving', 'bike', 'walking'

    // OSRM Public API base URL
    // Public demo server supports 'car' profile as 'driving'.
    // Semicolon separated coordinates: lng,lat
    const coordsString = [
      `${origin.lng},${origin.lat}`,
      ...destinations.map((d: any) => `${d.lng},${d.lat}`),
    ].join(';');

    // Profile mapping: OSRM demo server has 'driving'. We can estimate bike/walking from driving or calculate it.
    // Driving is standard.
    const url = `https://router.project-osrm.org/table/v1/driving/${coordsString}?sources=0&annotations=duration`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ToolateCommuteFilter/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`OSRM API responded with status ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.durations || !data.durations[0]) {
      throw new Error('OSRM API returned invalid durations');
    }

    // durations[0][0] is duration to origin itself (0).
    // durations[0][1] is to first destination, etc.
    const durationsSeconds = data.durations[0].slice(1);

    // Speed scaling factor for different modes relative to OSRM driving
    // Driving profile = 1.0
    // Walking: Average walk speed is 5km/h vs driving 35km/h (factor of ~7x slower)
    // Bike/2-wheeler: Often faster or similar to car in heavy Indian traffic, factor of ~0.85
    let factor = 1.0;
    if (travelMode === 'walking') {
      factor = 6.0;
    } else if (travelMode === 'bike') {
      factor = 0.85;
    }

    const results = destinations.map((d: any, idx: number) => {
      const originalSeconds = durationsSeconds[idx];
      let seconds = originalSeconds !== null && originalSeconds !== undefined ? originalSeconds * factor : null;
      
      // Fallback: If OSRM fails or coordinates are too far/routing not found, estimate using straight-line distance
      if (seconds === null) {
        const R = 6371; // Earth radius in km
        const dLat = (d.lat - origin.lat) * Math.PI / 180;
        const dLon = (d.lng - origin.lng) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(origin.lat * Math.PI / 180) * Math.cos(d.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // km

        // Speed estimates in km/h
        const speeds = {
          driving: 35,
          bike: 25,
          walking: 5,
        };
        const activeSpeed = speeds[travelMode as 'driving' | 'bike' | 'walking'] || 30;
        
        // Time = distance / speed * 3600 (seconds) + buffer
        seconds = (distance / activeSpeed) * 3600 * 1.3; // 1.3 routing overhead factor
      }

      return {
        id: d.id,
        durationMinutes: Math.round(seconds / 60),
        distanceKm: Number(((seconds / 3600) * (travelMode === 'walking' ? 5 : travelMode === 'bike' ? 25 : 35)).toFixed(1)),
      };
    });

    return NextResponse.json({
      mode: travelMode,
      results,
    });
  } catch (error: any) {
    console.error('Error in commute proxy API:', error);
    // Return graceful fallback estimation to client instead of error
    return NextResponse.json({ error: 'Failed to calculate commute routing' }, { status: 500 });
  }
}
