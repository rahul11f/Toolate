import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { listingRateLimiter } from '@/lib/redis';
import { z } from 'zod';
import { ListingCategory, ListingStatus } from '@/lib/types';

// Schema for creating a listing
const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  category: z.nativeEnum(ListingCategory),
  price: z.number().positive('Price must be a positive number.'),
  openingHours: z.string().min(1, 'Opening hours are required.'),
  closingHours: z.string().min(1, 'Closing hours are required.'),
  landlordTerms: z.string().min(5, 'Landlord terms must be at least 5 characters.'),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (must be 10 digits starting with 6-9).'),
  whatsappNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid WhatsApp number (must be 10 digits starting with 6-9).'),
  address: z.string().min(5, 'Address must be at least 5 characters.'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  area: z.string().min(2, 'Area is required.'),
  state: z.string().optional(),
  city: z.string().optional(),
  roommateType: z.enum(['HAVE_ROOM', 'NEED_ROOM']).optional().nullable(),
  roommateGender: z.enum(['MALE', 'FEMALE', 'ANY']).optional().nullable(),
  images: z.array(z.string().url()).min(1, 'At least one image is required.').max(5, 'Maximum 5 images allowed.'),
});

// GET: Retrieve approved listings with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as ListingCategory | null;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const area = searchParams.get('area') || undefined;
    const state = searchParams.get('state') || undefined;
    const city = searchParams.get('city') || undefined;
    const roommateType = searchParams.get('roommateType') || undefined;
    const roommateGender = searchParams.get('roommateGender') || undefined;
    const query = searchParams.get('query') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // 'price_asc', 'price_desc', 'createdAt'
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '9'))); // default 9 items
    const skip = (page - 1) * limit;

    // Build Prisma query filter
    const where: any = {
      status: ListingStatus.APPROVED, // only approved items are public
    };

    if (category && Object.values(ListingCategory).includes(category)) {
      where.category = category;
    }

    if (state) {
      where.state = state;
    }

    if (city) {
      where.city = city;
    }

    if (roommateType) {
      where.roommateType = roommateType;
    }

    if (roommateGender) {
      where.roommateGender = roommateGender;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (area) {
      where.area = {
        contains: area,
        mode: 'insensitive',
      };
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Build sorting option
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'createdAt_asc') {
      orderBy = { createdAt: 'asc' };
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    const parsedListings = listings.map(l => ({
      ...l,
      images: typeof l.images === 'string' ? JSON.parse(l.images) : l.images
    }));

    return NextResponse.json({
      listings: parsedListings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

// POST: Create a new listing (requires authentication)
export async function POST(req: NextRequest) {
  try {
    // 1. Verify user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // 2. Check rate limits
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `listing-limit:${userId || ip}`;
    const { success } = await listingRateLimiter.limit(rateLimitKey);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can create at most 10 listings per hour.' },
        { status: 429 }
      );
    }

    // 3. Validate form data
    const body = await req.json();
    const validationResult = createListingSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // 4. Insert listing with PENDING status
    const listing = await prisma.listing.create({
      data: {
        title: validationResult.data.title,
        description: validationResult.data.description,
        category: validationResult.data.category,
        price: validationResult.data.price,
        openingHours: validationResult.data.openingHours,
        closingHours: validationResult.data.closingHours,
        landlordTerms: validationResult.data.landlordTerms,
        contactNumber: validationResult.data.contactNumber,
        whatsappNumber: validationResult.data.whatsappNumber,
        address: validationResult.data.address,
        lat: validationResult.data.lat,
        lng: validationResult.data.lng,
        area: validationResult.data.area,
        state: validationResult.data.state || '',
        city: validationResult.data.city || '',
        roommateType: validationResult.data.roommateType,
        roommateGender: validationResult.data.roommateGender,
        images: JSON.stringify(validationResult.data.images),
        status: ListingStatus.PENDING,
        user: { connect: { id: userId } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Listing submitted successfully and is pending admin approval.',
      listing: {
        ...listing,
        images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images
      },
    });
  } catch (error: any) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
