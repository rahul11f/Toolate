import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating roommateGender for existing HOTEL listings...');
  
  const hotelListings = await prisma.listing.findMany({
    where: {
      category: 'HOTEL',
    },
  });

  console.log(`Found ${hotelListings.length} HOTEL listings.`);

  let updatedCount = 0;
  for (let i = 0; i < hotelListings.length; i++) {
    const listing = hotelListings[i];
    // Assign a gender preference deterministically
    const gender = i % 3 === 0 ? 'MALE' : i % 3 === 1 ? 'FEMALE' : 'ANY';
    
    await prisma.listing.update({
      where: { id: listing.id },
      data: { roommateGender: gender },
    });
    
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} HOTEL listings in the database!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
