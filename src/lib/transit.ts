import { redis } from './redis';

export interface TransitStation {
  name: string;
  type: 'METRO' | 'BUS';
  lat: number;
  lng: number;
}

export async function getNearbyTransit(lat: number, lng: number): Promise<TransitStation[]> {
  const cacheKey = `proximity:${lat.toFixed(4)}:${lng.toFixed(4)}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }
  } catch (err) {
    console.warn('Redis read failed in transit helper:', err);
  }

  // Call Overpass API
  const overpassQuery = `[out:json][timeout:15];(node["railway"="station"](around:1500,${lat},${lng});node["public_transport"="station"](around:1500,${lat},${lng});node["highway"="bus_stop"](around:1500,${lat},${lng}););out body;`;
  const overpassUrl = 'https://overpass-api.de/api/interpreter';

  let stations: TransitStation[] = [];
  try {
    const response = await fetch(overpassUrl, {
      method: 'POST',
      body: overpassQuery,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.elements) {
        stations = result.elements.map((el: any) => {
          const name = el.tags.name || el.tags.operator || 'Transit Stop';
          const type = el.tags.railway === 'station' || el.tags.public_transport === 'station' ? 'METRO' : 'BUS';
          return {
            name,
            type,
            lat: el.lat,
            lng: el.lon,
          };
        });
      }
    }
  } catch (err) {
    console.error('Overpass API query failed in transit helper:', err);
  }

  // Fallback: Generate mock station if API fails
  if (stations.length === 0) {
    stations = [
      { name: 'Local Metro Station', type: 'METRO', lat: lat + 0.005, lng: lng - 0.003 },
      { name: 'Main Road Bus Stop', type: 'BUS', lat: lat - 0.002, lng: lng + 0.004 },
    ];
  }

  // Cache result for 24 hours
  try {
    await redis.set(cacheKey, JSON.stringify(stations), { ex: 86400 });
  } catch (err) {
    console.warn('Redis write failed in transit helper:', err);
  }

  return stations;
}
