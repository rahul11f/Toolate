import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ListingCategory, ListingStatus } from '@/lib/types';
import { detectFraud } from '@/lib/fraud';

const singleImportSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  category: z.nativeEnum(ListingCategory),
  price: z.coerce.number().positive('Price must be a positive number.'),
  openingHours: z.string().default('9:00 AM'),
  closingHours: z.string().default('9:00 PM'),
  landlordTerms: z.string().min(5, 'Landlord terms must be at least 5 characters.'),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (must be 10 digits starting with 6-9).'),
  whatsappNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid WhatsApp number (must be 10 digits starting with 6-9).'),
  address: z.string().min(5, 'Address must be at least 5 characters.'),
  lat: z.coerce.number().min(-90).max(90).default(12.9716),
  lng: z.coerce.number().min(-180).max(180).default(77.5946),
  area: z.string().min(2, 'Area is required.'),
  state: z.string().default('Karnataka'),
  city: z.string().default('Bangalore'),
  roommateType: z.enum(['HAVE_ROOM', 'NEED_ROOM']).optional().nullable(),
  roommateGender: z.enum(['MALE', 'FEMALE', 'ANY']).optional().nullable(),
  images: z.array(z.string().url()).min(1, 'At least one image URL is required.'),
  facilities: z.string().default('{}'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const rawListings = body.listings;

    if (!rawListings || !Array.isArray(rawListings)) {
      return NextResponse.json({ error: 'Listings array is required.' }, { status: 400 });
    }

    if (rawListings.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 listings allowed per bulk upload.' }, { status: 400 });
    }

    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rawListings.length; i++) {
      const raw = rawListings[i];
      
      try {
        // Preprocess images (could be comma separated string)
        let imagesArray: string[] = [];
        if (typeof raw.images === 'string') {
          imagesArray = raw.images
            .split(',')
            .map((url: string) => url.trim())
            .filter((url: string) => url.startsWith('http'));
        } else if (Array.isArray(raw.images)) {
          imagesArray = raw.images;
        }

        // Preprocess roommate values
        const roommateType = raw.roommateType ? String(raw.roommateType).toUpperCase() : null;
        const roommateGender = raw.roommateGender ? String(raw.roommateGender).toUpperCase() : null;

        // Parse and Validate
        const validation = singleImportSchema.safeParse({
          ...raw,
          images: imagesArray,
          roommateType: roommateType || undefined,
          roommateGender: roommateGender || undefined,
        });

        if (!validation.success) {
          const errors = validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
          results.push({ row: i + 1, success: false, error: errors });
          failedCount++;
          continue;
        }

        const data = validation.data;

        // Auto extract foodType from facilities if applicable
        let foodType: string | null = null;
        try {
          const parsedFacilities = JSON.parse(data.facilities);
          if (parsedFacilities.foodType) {
            foodType = parsedFacilities.foodType;
          }
        } catch {}

        // Run auto fraud detector
        let aiFraudScore = 0;
        let aiFraudFlags = '[]';
        try {
          const fraudResult = await detectFraud(
            data.title,
            data.description,
            data.price,
            data.contactNumber
          );
          aiFraudScore = fraudResult.confidence;
          aiFraudFlags = JSON.stringify(fraudResult.flags);
        } catch (err) {
          console.error(`Row ${i + 1} fraud check failed:`, err);
        }

        // Create Database entry
        await prisma.listing.create({
          data: {
            title: data.title,
            description: data.description,
            category: data.category,
            price: data.price,
            openingHours: data.openingHours,
            closingHours: data.closingHours,
            landlordTerms: data.landlordTerms,
            contactNumber: data.contactNumber,
            whatsappNumber: data.whatsappNumber,
            address: data.address,
            lat: data.lat,
            lng: data.lng,
            area: data.area,
            state: data.state,
            city: data.city,
            roommateType: data.roommateType,
            roommateGender: data.roommateGender,
            images: JSON.stringify(data.images),
            facilities: data.facilities,
            foodType,
            aiFraudScore,
            aiFraudFlags,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
            status: ListingStatus.PENDING,
            user: { connect: { id: userId } },
          },
        });

        results.push({ row: i + 1, success: true });
        successCount++;
      } catch (err: any) {
        console.error(`Error importing row ${i + 1}:`, err);
        results.push({ row: i + 1, success: false, error: err.message || 'Database error occurred.' });
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      failedCount,
      results,
    });
  } catch (error: any) {
    console.error('Bulk Import API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
