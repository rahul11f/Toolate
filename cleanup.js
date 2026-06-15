const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  console.log('Finding expired listings before:', now);

  const expiredListings = await prisma.listing.findMany({
    where: {
      expiresAt: { lte: now }
    }
  });

  if (expiredListings.length === 0) {
    console.log('No expired listings found!');
    return;
  }

  console.log(`Found ${expiredListings.length} expired listings. Deleting them...`);
  
  const updatedIds = expiredListings.map(l => l.id);
  
  const res = await prisma.listing.deleteMany({
    where: { id: { in: updatedIds } }
  });

  console.log(`Successfully deleted ${res.count} listings.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
