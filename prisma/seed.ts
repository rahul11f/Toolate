import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Hashed Passwords
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const userPasswordHash = await bcrypt.hash('User@123', 10);

  // 2. Seed Admin User
  const adminEmail = 'admin@toolate.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'System Admin',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });
    console.log('Seeded admin user:', admin.email);
  }

  // 3. Seed Regular User
  const userEmail = 'user@toolate.com';
  let user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Rahul Sharma',
        email: userEmail,
        passwordHash: userPasswordHash,
        role: 'USER',
        emailVerified: new Date(),
      },
    });
    console.log('Seeded regular user:', user.email);
  }

  // 4. Seed Mock Properties
  const mockProperties = [
    {
      title: 'Luxury 3 BHK Villa with Private Garden',
      description: 'Elegant 3-bedroom villa in a gated community. Features a private landscaped garden, high ceilings, modular kitchen, servants quarter, and 24/7 security backup. Perfect for families looking for quiet premium spaces.',
      category: 'VILLA',
      price: 85000,
      openingHours: '09:00',
      closingHours: '19:00',
      landlordTerms: '10 months security deposit, minimum 1-year lease, families only, pets allowed.',
      contactNumber: '9876543210',
      whatsappNumber: '9876543210',
      address: 'Prestige Lakeside Habitat, Varthur Road, Whitefield, Bangalore, Karnataka, 560087',
      lat: 12.9463,
      lng: 77.7479,
      area: 'Whitefield',
      state: 'Karnataka',
      city: 'Bangalore',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: true,
      status: 'APPROVED',
      userId: user.id,
    },
    {
      title: 'Premium 2 BHK Flat Near Tech Park',
      description: 'Fully furnished 2 BHK apartment with balcony overlooking the pool. Located just 5 minutes walk from Manyata Tech Park. Includes modular wardrobes, geysers, RO filter, sofa set, and dining table.',
      category: 'FLAT',
      price: 32000,
      openingHours: '10:00',
      closingHours: '20:00',
      landlordTerms: '5 months deposit, bachelors or families welcome, vegetarian preferred.',
      contactNumber: '9123456789',
      whatsappNumber: '9123456789',
      address: 'Manyata Residency, Hebbal Outer Ring Rd, Bangalore, Karnataka, 560045',
      lat: 13.0456,
      lng: 77.6205,
      area: 'Hebbal',
      state: 'Karnataka',
      city: 'Bangalore',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: true,
      status: 'APPROVED',
      userId: user.id,
    },
    {
      title: 'Cozy Double Sharing PG for Girls',
      description: 'Comfortable double-sharing hostel accommodation for female students and professionals. Amenities include 3 times North/South Indian meals, high-speed Wi-Fi, laundry service, daily cleaning, and CCTV security.',
      category: 'HOSTEL',
      price: 9500,
      openingHours: '08:00',
      closingHours: '21:30',
      landlordTerms: '1 month advance rent, gate curfew at 10:30 PM, visitors not allowed inside rooms.',
      contactNumber: '8765432109',
      whatsappNumber: '8765432109',
      address: 'Stanza Living, 12th Main Road, HAL 2nd Stage, Indiranagar, Bangalore, Karnataka, 560038',
      lat: 12.9716,
      lng: 77.6412,
      area: 'Indiranagar',
      state: 'Karnataka',
      city: 'Bangalore',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: false,
      status: 'APPROVED',
      userId: user.id,
    },
    {
      title: 'Commercial Corner Shop in High Footfall Market',
      description: 'Ideal retail outlet shop with 450 sq.ft floor area. Ground floor location with wide glass facade front. Perfect for boutique, mobile shop, cafe, or dispensary. Located in the main market lane.',
      category: 'SHOP',
      price: 55000,
      openingHours: '09:00',
      closingHours: '22:00',
      landlordTerms: '6 months deposit, commercial tax extra, minimum 3-year agreement.',
      contactNumber: '7654321098',
      whatsappNumber: '7654321098',
      address: 'Commercial Street Market Road, Shivaji Nagar, Bangalore, Karnataka, 560001',
      lat: 12.9818,
      lng: 77.6074,
      area: 'Shivaji Nagar',
      state: 'Karnataka',
      city: 'Bangalore',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: true,
      status: 'APPROVED',
      userId: user.id,
    },
    {
      title: 'Dedicated Coworking Hot Desks',
      description: 'Professional shared workspace desks with high-speed internet, ergonomic chairs, power backup, meeting room credits, printing access, and unlimited premium tea/coffee. Located in a top business park.',
      category: 'COWORKING',
      price: 6500,
      openingHours: '08:00',
      closingHours: '20:00',
      landlordTerms: 'Monthly rolling subscription, 15 days notice period for cancellation.',
      contactNumber: '9988776655',
      whatsappNumber: '9988776655',
      address: 'WeWork Galaxy, 43 Residency Road, Bangalore, Karnataka, 560025',
      lat: 12.9705,
      lng: 77.6068,
      area: 'Residency Road',
      state: 'Karnataka',
      city: 'Bangalore',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: false,
      status: 'APPROVED',
      userId: user.id,
    },
    {
      title: 'Modern Single BHK flat for Rent',
      description: 'Compact 1 BHK house flat with utility area, perfect for single occupants. Situated in a residential area close to parks, gyms, and supermarkets. Gated parking for two-wheelers available.',
      category: 'FLAT',
      price: 18000,
      openingHours: '09:30',
      closingHours: '19:30',
      landlordTerms: '6 months deposit, bachelors only, quiet environment expected.',
      contactNumber: '8899001122',
      whatsappNumber: '8899001122',
      address: '5th Cross, Sector 7, HSR Layout, Bangalore, Karnataka, 560102',
      lat: 12.9128,
      lng: 77.6388,
      area: 'HSR Layout',
      state: 'Karnataka',
      city: 'Bangalore',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: false,
      status: 'PENDING', // Will show in Admin Queue
      userId: user.id,
    },
    {
      title: 'Spacious Commercial Warehouse',
      description: 'Industrial warehouse storage space measuring 2500 sq.ft. Heavy vehicle access, high shutter gates, concrete flooring, and separate watchman office. Perfect for distribution and e-commerce storage.',
      category: 'WAREHOUSE',
      price: 120000,
      openingHours: '06:00',
      closingHours: '21:00',
      landlordTerms: '1-year security deposit, long-term commercial lease agreements only.',
      contactNumber: '7766554433',
      whatsappNumber: '7766554433',
      address: 'Peenya Industrial Area Stage 1, Bangalore, Karnataka, 560058',
      lat: 13.0308,
      lng: 77.5255,
      area: 'Peenya',
      state: 'Karnataka',
      city: 'Bangalore',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: false,
      status: 'PENDING', // Will show in Admin Queue
      userId: user.id,
    },
    {
      title: 'Independent PG Double Room',
      description: 'Spacious PG accommodation for students near Christ University. Offers double occupancy, hot water geysers, high-speed internet, wardens on site, and filtered drinking water.',
      category: 'PG',
      price: 11000,
      openingHours: '09:00',
      closingHours: '20:00',
      landlordTerms: '2 months advance deposit, strictly no smoking or alcohol permitted.',
      contactNumber: '9080706050',
      whatsappNumber: '9080706050',
      address: 'Koramangala 3rd Block, Bangalore, Karnataka, 560034',
      lat: 12.9322,
      lng: 77.6254,
      area: 'Koramangala',
      state: 'Karnataka',
      city: 'Bangalore',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: false,
      status: 'APPROVED',
      userId: user.id,
    },
    // --- Additional listings in other cities/states ---
    {
      title: 'Furnished 2 BHK in Andheri West',
      description: 'Modern fully furnished apartment near Lokhandwala. Walking distance to metro station. Includes AC in all rooms, washing machine, microwave, and premium modular kitchen.',
      category: 'FLAT',
      price: 45000,
      openingHours: '10:00',
      closingHours: '19:00',
      landlordTerms: '3 months security deposit, families and working professionals preferred.',
      contactNumber: '9876501234',
      whatsappNumber: '9876501234',
      address: 'Lokhandwala Complex, Andheri West, Mumbai, Maharashtra, 400053',
      lat: 19.1365,
      lng: 72.8296,
      area: 'Andheri West',
      state: 'Maharashtra',
      city: 'Mumbai',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: true,
      status: 'APPROVED',
      userId: user.id,
    },
    {
      title: 'Spacious 3 BHK in Sector 62',
      description: 'Semi-furnished 3 BHK apartment in a prime IT corridor. Close to Noida Electronic City metro. Society has swimming pool, gym, and clubhouse. Power backup available.',
      category: 'FLAT',
      price: 28000,
      openingHours: '09:00',
      closingHours: '20:00',
      landlordTerms: '2 months deposit, family with max 4 members, no pets.',
      contactNumber: '9012345678',
      whatsappNumber: '9012345678',
      address: 'Supertech Cape Town, Sector 62, Noida, Uttar Pradesh, 201301',
      lat: 28.6270,
      lng: 77.3654,
      area: 'Sector 62',
      state: 'Uttar Pradesh',
      city: 'Noida',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: false,
      status: 'APPROVED',
      userId: user.id,
    },
    {
      title: 'Premium Office Space in Connaught Place',
      description: 'Fully furnished plug-and-play office space with 20 workstations. Conference room, pantry, reception area included. Located in the heart of Delhi CBD.',
      category: 'OFFICE',
      price: 150000,
      openingHours: '08:00',
      closingHours: '21:00',
      landlordTerms: '6 months deposit, 2-year minimum lock-in period, commercial registration required.',
      contactNumber: '9988001122',
      whatsappNumber: '9988001122',
      address: 'Block A, Connaught Place, New Delhi, Delhi, 110001',
      lat: 28.6315,
      lng: 77.2167,
      area: 'Connaught Place',
      state: 'Delhi',
      city: 'New Delhi',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: true,
      status: 'APPROVED',
      userId: user.id,
    },
    {
      title: 'Girls PG Near Hinjewadi IT Park',
      description: 'Well-maintained PG accommodation for working women. Triple sharing rooms with attached washroom. Includes meals, Wi-Fi, housekeeping, and CCTV surveillance.',
      category: 'PG',
      price: 8500,
      openingHours: '07:00',
      closingHours: '22:00',
      landlordTerms: '1 month advance, no visitors after 8 PM, ID proof mandatory.',
      contactNumber: '8877665544',
      whatsappNumber: '8877665544',
      address: 'Phase 1, Hinjewadi, Pune, Maharashtra, 411057',
      lat: 18.5913,
      lng: 73.7389,
      area: 'Hinjewadi',
      state: 'Maharashtra',
      city: 'Pune',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: false,
      status: 'APPROVED',
      userId: user.id,
    },
    {
      title: 'Looking for a flatmate in HSR Layout 2BHK',
      description: 'Hi! I have a fully furnished 2 BHK apartment in HSR Layout Sector 3. Looking for a friendly, tidy roommate to occupy the master bedroom. Room has attached washroom and balcony. Shared kitchen and living room. Non-smoker preferred.',
      category: 'ROOMMATE',
      price: 15000,
      openingHours: '09:00',
      closingHours: '21:00',
      landlordTerms: '3 months deposit, electricity and Wi-Fi bills will be split equally.',
      contactNumber: '9888776655',
      whatsappNumber: '9888776655',
      address: 'Sector 3, HSR Layout, Bangalore, Karnataka, 560102',
      lat: 12.9105,
      lng: 77.6421,
      area: 'HSR Layout',
      state: 'Karnataka',
      city: 'Bangalore',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: true,
      status: 'APPROVED',
      roommateType: 'HAVE_ROOM',
      roommateGender: 'ANY',
      userId: user.id,
    },
    {
      title: 'Need single room/flatmate near Manyata Tech Park',
      description: 'Hey, I am starting a job at Manyata Tech Park and looking for a shared flat or a single room nearby. I am chill, respect privacy, and enjoy cooking. Budget is around 12,000 INR. Need a male roommate.',
      category: 'ROOMMATE',
      price: 12000,
      openingHours: '10:00',
      closingHours: '20:00',
      landlordTerms: 'Willing to share security deposit and lease agreement.',
      contactNumber: '8877554433',
      whatsappNumber: '8877554433',
      address: 'Hebbal, Bangalore, Karnataka, 560045',
      lat: 13.0401,
      lng: 77.6185,
      area: 'Hebbal',
      state: 'Karnataka',
      city: 'Bangalore',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80'
      ]),
      featured: false,
      status: 'APPROVED',
      roommateType: 'NEED_ROOM',
      roommateGender: 'MALE',
      userId: user.id,
    },
  ];

  for (const prop of mockProperties) {
    const existing = await prisma.listing.findFirst({
      where: { title: prop.title },
    });
    if (!existing) {
      await prisma.listing.create({
        data: prop,
      });
      console.log('Seeded property listing:', prop.title);
    }
  }

  // 5. Seed default SiteSettings
  const existingSettings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: { id: 'default' },
    });
    console.log('Seeded default site settings.');
  }

  // 6. Update existing listings that have empty state/city
  const emptyStateListings = await prisma.listing.findMany({
    where: { state: '' },
  });
  for (const listing of emptyStateListings) {
    // Extract state/city from address for existing Bangalore listings
    if (listing.address.includes('Bangalore') || listing.address.includes('Karnataka')) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { state: 'Karnataka', city: 'Bangalore' },
      });
      console.log('Updated state/city for:', listing.title);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
