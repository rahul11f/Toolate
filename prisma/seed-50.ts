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

const titleAdjectives = [
  'Spacious', 'Modern', 'Cozy', 'Premium', 'Charming', 'Elegant', 'Sunlit', 
  'Vibrant', 'Quiet', 'Stunning', 'Fully Furnished', 'Renovated', 'Scenic', 
  'Luxury', 'High-speed', 'Comfortable'
];

const roommateGenders = ['MALE', 'FEMALE', 'ANY'];

function generateListingData(category: ListingCategory, i: number, cityData: typeof cities[0]) {
  const adj = titleAdjectives[i % titleAdjectives.length];
  let title = '';
  let description = '';

  switch (category) {
    case ListingCategory.ROOMMATE:
      title = `${adj} roommate share in ${cityData.area}`;
      description = `Looking for a friendly, clean, and cooperative flatmate to share a beautiful flat in ${cityData.area}, ${cityData.name}. The room is well-ventilated with an attached bathroom. The kitchen has all modern utensils, a refrigerator, and a washing machine. Rent and utility bills will be split 50/50. Ideal for young IT professionals or university students who appreciate a quiet, tidy living space.`;
      break;
    case ListingCategory.HOTEL:
      const hotelNames = ['Grand Hyatt', 'Taj Palace', 'Radisson Blu', 'JW Marriott', 'The Leela', 'Hilton Hotel', 'Sheraton Grand'];
      const hotelName = hotelNames[i % hotelNames.length];
      title = `${i % 2 === 0 ? 'Co-stay Query' : 'Hotel cost split'} at ${hotelName}`;
      description = `Looking to coordinate a cost-split stay at the premium ${hotelName} in ${cityData.area}, ${cityData.name}. I have already confirmed/planned a double-occupancy booking for business conference travel. Hoping to connect with a verified, like-minded traveler to split the bill 50/50 and share the suite. Curfew, hygiene, and mutual respect of privacy are highly valued.`;
      break;
    case ListingCategory.HOUSE_GUEST:
      title = `${adj} homestay & guest hosting in ${cityData.area}`;
      description = `Welcome to a warm, home-like experience with a local family in ${cityData.area}, ${cityData.name}. We offer a cozy private guest bedroom with home-cooked meals included. Perfect for travelers looking for local insights, culture exchange, or a quiet place to crash. Stay options are flexible (paid daily rate or skills exchange for housework/tutoring).`;
      break;
    case ListingCategory.SHARE_STAY:
      const shareTypes = ['Room/Flat Share', 'Co-living space', 'PG Bed', 'Travel Companion'];
      const shareType = shareTypes[i % shareTypes.length];
      title = `${adj} ${shareType} stay coordination`;
      description = `Seeking a companion for shared accommodation in ${cityData.area}, ${cityData.name}. This is an open coordination listing for a ${shareType.toLowerCase()}. The goal is to connect, verify each other's credentials, select a stay place, and split all rent and maintenance costs equally. Looking for a respectful person with clean habits.`;
      break;
    case ListingCategory.FLAT:
      title = `${adj} ${i % 2 === 0 ? '2 BHK' : '1 BHK'} Flat for rent in ${cityData.area}`;
      description = `A beautiful, newly built apartment in the heart of ${cityData.area}, ${cityData.name}. Features a spacious living room, modern modular kitchen, wardrobes, high-speed fiber internet, and 24/7 water supply. Located in a safe, gated community with walking access to metro, supermarkets, parks, and gyms. High-quality flooring and premium electrical fittings.`;
      break;
    case ListingCategory.HOUSE:
      title = `${adj} independent ${i % 2 === 0 ? '3 BHK' : '2 BHK'} House for lease`;
      description = `Spacious independent house with a private terrace and double parking space. Situated in a leafy, peaceful residential lane of ${cityData.area}, ${cityData.name}. Includes a massive hall, separate dining section, master bedroom with balcony, and modern bathrooms. 24/7 power backup and water availability. Ideal for families.`;
      break;
    case ListingCategory.VILLA:
      title = `Premium ${adj} 4 BHK Luxury Villa in ${cityData.area}`;
      description = `Stunning architectural design villa located in a premium gated enclave. Features a landscaped private garden, marble flooring, servant quarters, home automation system, and private parking. Residents get access to a luxury clubhouse, swimming pool, gym, and sports courts. Safe, high-end environment for premium living.`;
      break;
    case ListingCategory.PG:
      title = `${adj} single & double sharing PG near ${cityData.area}`;
      description = `Well-managed paying guest accommodation for students and working professionals. Amenities include 3 times nutritious veg/non-veg meals, high-speed Wi-Fi, laundry service, daily room cleaning, and hot water. 24/7 warden availability, CCTV security, and strict verification protocols ensure a safe stay.`;
      break;
    case ListingCategory.HOSTEL:
      title = `${adj} co-living hostel accommodation in ${cityData.area}`;
      description = `Modern, vibrant backpacker and co-living hostel. Offers comfortable single beds in dormitories, common lounges, working desks for digital nomads, self-service kitchen, and recreational gaming areas. Perfect for travelers looking to connect, share stories, and live in a community-driven environment.`;
      break;
    case ListingCategory.DORMITORY:
      title = `Budget ${adj} Dormitory bed space in ${cityData.area}`;
      description = `Affordable and clean dormitory beds with locker facilities. Includes clean bedsheets, shared washrooms with hot water, and high-speed Wi-Fi. Ideal for budget travelers, students, or transit stays looking for a quick, cheap, and safe place to rest overnight. Close to major transit hubs and metro stations.`;
      break;
    case ListingCategory.OFFICE:
      title = `Plug-and-play ${adj} Commercial Office space`;
      description = `Fully furnished commercial office ready for immediate occupation. Features 15+ workstations, 2 private manager cabins, a conference room with AV equipment, reception desk, pantry area, and server room. Includes high-speed leased line internet, central AC, power backup, and round-the-clock security.`;
      break;
    case ListingCategory.COWORKING:
      title = `Shared desks & Coworking passes at ${cityData.area} Hub`;
      description = `Flexible coworking hot desks, dedicated desks, and private cabins. Amenities include high-speed secure Wi-Fi, printer/scanner access, meeting room credits, and unlimited coffee/tea. Vibrant professional community, regular networking events, and an excellent environment to boost your productivity.`;
      break;
    case ListingCategory.SHOP:
      title = `Corner retail ${adj} Shop in busy ${cityData.area} market`;
      description = `High-visibility commercial shop with a wide glass facade. Located in a high-footfall market street of ${cityData.area}. Features central ventilation, tiled flooring, fire safety equipment, and ample storage space. Suitable for boutiques, showrooms, medical clinics, or retail franchises.`;
      break;
    case ListingCategory.WAREHOUSE:
      title = `Spacious industrial ${adj} Warehouse in ${cityData.area} sector`;
      description = `Large commercial warehouse measuring 4000 sq.ft with high ceilings and heavy vehicle loading docks. Includes 24/7 security guard cabin, CCTV coverage, industrial-grade concrete flooring, and an attached administrative office room. Perfect for retail storage, distribution centers, or logistics hub.`;
      break;
    case ListingCategory.DHARAMSHALA:
      title = `Peaceful Dharamshala room near temple, ${cityData.area}`;
      description = `Traditional, clean, and peaceful lodging facility for pilgrims. Offers basic rooms with attached washrooms, 24-hour hot water, and drinking water. Managed by a charitable trust with low-cost meals (Bhojanalaya) available on-site. Close to transit points and religious sites. Quiet hours strictly enforced.`;
      break;
    case ListingCategory.HOURLY_ROOM:
      title = `Flexible transit ${adj} Room (Hourly basis) in ${cityData.area}`;
      description = `Short-stay transit rooms available on hourly slots (3/6/12 hours). Quiet, clean, and air-conditioned room with an attached bath, fresh linens, and high-speed Wi-Fi. Ideal for business travelers on quick layovers, transit rest, or fresh-up before meetings. Strict guest policy and ID verification required.`;
      break;
    default:
      title = `${adj} property listing in ${cityData.area}`;
      description = `Premium property listing situated in the prime area of ${cityData.area}. Clean surroundings, easy access to transport hubs, daily essentials, and professional maintenance. Ideal for check-in coordination. Features all modern amenities.`;
  }

  return { title, description };
}

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

  console.log('Generating 50 unique listings...');

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

    const { title, description } = generateListingData(category, i, cityData);

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
    } else if (category === ListingCategory.HOTEL) {
      facilities.isAlreadyBooked = i % 2 === 0;
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
        roommateGender: (category === ListingCategory.ROOMMATE || category === ListingCategory.SHARE_STAY || category === ListingCategory.HOTEL) ? roommateGenders[i % roommateGenders.length] : null,
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

  console.log(`Successfully seeded ${createdCount} unique Listings!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
