import { PrismaClient } from '@prisma/client';
import { ListingCategory, ListingStatus } from '../src/lib/types';

const prisma = new PrismaClient();

const categories = Object.values(ListingCategory);

const cities = [
  { name: 'Bangalore', state: 'Karnataka', area: 'Indiranagar', lat: 12.9716, lng: 77.6412 },
  { name: 'Bangalore', state: 'Karnataka', area: 'HSR Layout', lat: 12.9128, lng: 77.6388 },
  { name: 'Bangalore', state: 'Karnataka', area: 'Koramangala', lat: 12.9322, lng: 77.6254 },
  { name: 'Mumbai', state: 'Maharashtra', area: 'Andheri West', lat: 19.1365, lng: 72.8296 },
  { name: 'Mumbai', state: 'Maharashtra', area: 'Bandra West', lat: 19.0607, lng: 72.8362 },
  { name: 'New Delhi', state: 'Delhi', area: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
  { name: 'Pune', state: 'Maharashtra', area: 'Hinjewadi', lat: 18.5913, lng: 73.7389 },
  { name: 'Chennai', state: 'Tamil Nadu', area: 'Adyar', lat: 13.0033, lng: 80.2550 },
];

const unsplashImages = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80'
];

async function main() {
  // Find or create regular user to own these listings
  let user = await prisma.user.findFirst({
    where: { role: 'USER' }
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        documentVerified: true,
        documentStatus: 'VERIFIED',
        legalName: user.name || 'Rahul Sharma'
      }
    });
    const deleted = await prisma.listing.deleteMany({
      where: { userId: user.id }
    });
    console.log(`Cleaned up ${deleted.count} existing listings.`);
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Rahul Sharma',
        email: 'user@toolate.com',
        passwordHash: '$2b$10$W1X1vHjZ84.mX7mF9Z4z9e5Nf2b0L4Vz2qS3m9F0Q6k3qK1z1z1z1', // mock password
        role: 'USER',
        emailVerified: new Date(),
        documentVerified: true,
        documentStatus: 'VERIFIED',
        legalName: 'Rahul Sharma',
      }
    });
    console.log('Created mock user for seeding:', user.email);
  }

  console.log('Generating 50 listings...');

  let createdCount = 0;

  for (let i = 1; i <= 50; i++) {
    const category = categories[i % categories.length];
    const cityData = cities[i % cities.length];
    
    // Customize price based on category
    let price = 15000;
    if (category === ListingCategory.VILLA) price = 75000 + (i * 1000);
    else if (category === ListingCategory.HOUSE || category === ListingCategory.FLAT) price = 25000 + (i * 500);
    else if (category === ListingCategory.OFFICE || category === ListingCategory.WAREHOUSE) price = 90000 + (i * 2000);
    else if (category === ListingCategory.SHOP) price = 40000 + (i * 800);
    else if (category === ListingCategory.PG || category === ListingCategory.HOSTEL || category === ListingCategory.DORMITORY) price = 7000 + (i * 150);
    else if (category === ListingCategory.DHARAMSHALA) price = 300 + (i * 10);
    else if (category === ListingCategory.HOURLY_ROOM) price = 600 + (i * 20);
    else if (category === ListingCategory.HOUSE_GUEST) price = 0; // Couchsurfing model
    else if (category === ListingCategory.SHARE_STAY) price = 8000 + (i * 200);

    const title = `Vetted ${category.replace('_', ' ')} ${i} near ${cityData.area}`;
    const description = `This is a premium, verified listing for a ${category.toLowerCase().replace('_', ' ')} located in the prime area of ${cityData.area}, ${cityData.name}. It offers clean surroundings, easy access to transport hubs, daily essentials, and professional maintenance. Ideal for check-in coordination. Features all modern amenities as listed.`;

    const facilities: Record<string, any> = {
      parking: i % 2 === 0 ? 'BOTH' : 'BIKE',
      furnishedStatus: i % 3 === 0 ? 'FURNISHED' : 'SEMI_FURNISHED',
      electricityCharges: 'SPLIT_EQUALLY',
      internet: true,
      powerBackup: true,
      kitchenAccess: true,
      acAvailable: i % 4 === 0,
      wfhFriendly: i % 5 === 0,
      wfhWifi: true,
      wfhDesk: true,
    };

    // Add category-specific facilities
    if (category === ListingCategory.SHARE_STAY) {
      facilities.shareType = i % 3 === 0 ? 'HOTEL' : i % 3 === 1 ? 'ROOM' : 'PG_BED';
      facilities.shareDuration = i % 2 === 0 ? 'MONTHLY' : 'WEEKLY';
      facilities.openToAnyone = i % 4 !== 0;
    }

    const imageIndex1 = i % unsplashImages.length;
    const imageIndex2 = (i + 1) % unsplashImages.length;
    const imagesList = [unsplashImages[imageIndex1], unsplashImages[imageIndex2]];

    const isHotelShare = category === ListingCategory.HOTEL;

    await prisma.listing.create({
      data: {
        title,
        description,
        category,
        price,
        openingHours: '09:00',
        closingHours: '21:00',
        landlordTerms: 'No broker charges. Vetted coordinate listing. Quiet hours expected.',
        contactNumber: `98765${String(10000 + i).substring(0, 5)}`,
        whatsappNumber: `98765${String(10000 + i).substring(0, 5)}`,
        address: `${i * 10} Main Road, Block ${i % 5}, ${cityData.area}, ${cityData.name}, ${cityData.state}`,
        lat: cityData.lat + (Math.sin(i) * 0.005),
        lng: cityData.lng + (Math.cos(i) * 0.005),
        area: cityData.area,
        city: cityData.name,
        state: cityData.state,
        images: JSON.stringify(imagesList),
        facilities: JSON.stringify(facilities),
        featured: i % 8 === 0,
        status: ListingStatus.APPROVED, // Make them live immediately
        roommateType: category === ListingCategory.ROOMMATE ? (i % 2 === 0 ? 'HAVE_ROOM' : 'NEED_ROOM') : null,
        roommateGender: (category === ListingCategory.ROOMMATE || category === ListingCategory.SHARE_STAY) ? (i % 3 === 0 ? 'MALE' : i % 3 === 1 ? 'FEMALE' : 'ANY') : null,
        userId: user.id,
        isSharedHotelRoom: isHotelShare,
        hotelSplitStatus: isHotelShare ? 'AVAILABLE' : 'AVAILABLE',
        hotelName: isHotelShare ? `${cityData.name} Grand Plaza` : null,
        hotelBookingRef: isHotelShare ? `REF-HOTEL-${10000 + i}` : null,
        checkInDate: isHotelShare ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) : null,
        checkOutDate: isHotelShare ? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) : null,
        hotelBookingProofUrl: isHotelShare ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80' : null,
        requireVerification: isHotelShare ? true : false,
      }
    });

    createdCount++;
  }

  console.log(`Successfully seeded ${createdCount} Listings!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
