import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_LAT = 12.9716;
const DEFAULT_LNG = 77.5946;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fixCoordinates() {
  console.log('Starting coordinate fix script...');

  const listings = await prisma.listing.findMany({
    where: {
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
    },
    select: {
      id: true,
      title: true,
      address: true,
    }
  });

  console.log(`Found ${listings.length} listings with default Bangalore coordinates.`);

  let updated = 0;
  let failed = 0;

  for (const listing of listings) {
    if (!listing.address) continue;

    console.log(`Processing listing: "${listing.title}" (Address: ${listing.address})`);

    try {
      // Respect Nominatim's usage policy (1 request per second)
      await sleep(1500);

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(listing.address)}&limit=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'ToolateApp/1.0' } });
      const data = await res.json();

      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);

        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            lat: newLat,
            lng: newLng,
          }
        });
        
        console.log(`✅ Updated ${listing.id} to (${newLat}, ${newLng})`);
        updated++;
      } else {
        console.log(`❌ Could not geocode address: "${listing.address}"`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ Error processing ${listing.id}:`, err);
      failed++;
    }
  }

  console.log(`\nFinished! Updated: ${updated}, Failed: ${failed}`);
  await prisma.$disconnect();
}

fixCoordinates().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
