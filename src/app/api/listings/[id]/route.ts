import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { ListingCategory, ListingStatus, Role } from '@/lib/types';

const updateListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters.').optional(),
  category: z.nativeEnum(ListingCategory).optional(),
  price: z.number().nonnegative('Price must be 0 or positive.').optional(),
  openingHours: z.string().min(1, 'Opening hours are required.').optional(),
  closingHours: z.string().min(1, 'Closing hours are required.').optional(),
  landlordTerms: z.string().min(5, 'Landlord terms must be at least 5 characters.').optional(),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number.').optional(),
  whatsappNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid WhatsApp number.').optional(),
  address: z.string().min(5, 'Address must be at least 5 characters.').optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  area: z.string().min(2, 'Area is required.').optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  roommateType: z.enum(['HAVE_ROOM', 'NEED_ROOM']).optional().nullable(),
  roommateGender: z.enum(['MALE', 'FEMALE', 'ANY']).optional().nullable(),
  images: z.array(z.string().url()).min(1, 'At least one image is required.').max(5, 'Maximum 5 images allowed.').optional(),
  requireVerification: z.boolean().optional(),
  isSharedHotelRoom: z.boolean().optional(),
  hotelName: z.string().optional().nullable(),
  hotelBookingRef: z.string().optional().nullable(),
  checkInDate: z.string().optional().nullable(),
  checkOutDate: z.string().optional().nullable(),
  hotelBookingProofUrl: z.string().optional().nullable(),
});

// GET: Retrieve single listing by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    // If listing is not approved, only the owner or admin can view it
    if (listing.status !== ListingStatus.APPROVED) {
      const session = await getServerSession(authOptions);
      const userId = session?.user ? (session.user as any).id : null;
      const userRole = session?.user ? (session.user as any).role : null;

      const isOwner = userId === listing.userId;
      const isAdmin = userRole === Role.ADMIN;

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Listing is pending approval.' }, { status: 403 });
      }
    }

    return NextResponse.json({
      ...listing,
      images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images
    });
  } catch (error: any) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

// PUT: Edit listing (owner or admin only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Verify user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // 2. Fetch the listing to verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const isOwner = listing.userId === userId;
    const isAdmin = userRole === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden. You do not own this listing.' }, { status: 403 });
    }

    // 3. Validate request body
    const body = await req.json();
    const validationResult = updateListingSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // 4. Update the listing (reverts status to PENDING if user edits, or keeps status if ADMIN edits)
    const updateData: any = {
      ...validationResult.data,
      status: isAdmin ? listing.status : ListingStatus.PENDING,
    };
    if (validationResult.data.images) {
      updateData.images = JSON.stringify(validationResult.data.images);
    }
    if (body.facilities) {
      updateData.facilities = body.facilities;
    }
    if (validationResult.data.checkInDate !== undefined) {
      updateData.checkInDate = validationResult.data.checkInDate ? new Date(validationResult.data.checkInDate) : null;
    }
    if (validationResult.data.checkOutDate !== undefined) {
      updateData.checkOutDate = validationResult.data.checkOutDate ? new Date(validationResult.data.checkOutDate) : null;
      if (validationResult.data.checkOutDate) {
        updateData.expiresAt = new Date(validationResult.data.checkOutDate);
      }
    }

    // Validate hotel room sharing and force verification (if already booked)
    let requireVerification = validationResult.data.requireVerification !== undefined ? validationResult.data.requireVerification : listing.requireVerification;
    let isAlreadyBooked = true;
    try {
      const facilitiesData = body.facilities ? (typeof body.facilities === 'string' ? JSON.parse(body.facilities) : body.facilities) : {};
      if (facilitiesData.isAlreadyBooked === false) {
        isAlreadyBooked = false;
      }
    } catch {}

    const category = validationResult.data.category || listing.category;
    const isSharedHotelRoom = validationResult.data.isSharedHotelRoom !== undefined ? validationResult.data.isSharedHotelRoom : listing.isSharedHotelRoom;
    
    if (category === ListingCategory.HOTEL && isSharedHotelRoom) {
      if (isAlreadyBooked) {
        requireVerification = true;
        const hotelName = validationResult.data.hotelName !== undefined ? validationResult.data.hotelName : listing.hotelName;
        const hotelBookingRef = validationResult.data.hotelBookingRef !== undefined ? validationResult.data.hotelBookingRef : listing.hotelBookingRef;
        const checkInDate = validationResult.data.checkInDate !== undefined ? validationResult.data.checkInDate : listing.checkInDate;
        const checkOutDate = validationResult.data.checkOutDate !== undefined ? validationResult.data.checkOutDate : listing.checkOutDate;
        const hotelBookingProofUrl = validationResult.data.hotelBookingProofUrl !== undefined ? validationResult.data.hotelBookingProofUrl : listing.hotelBookingProofUrl;

        if (!hotelName || !hotelBookingRef || !checkInDate || !checkOutDate || !hotelBookingProofUrl) {
          return NextResponse.json({ error: 'All hotel room sharing details and booking proof are required.' }, { status: 400 });
        }
      } else {
        const checkInDate = validationResult.data.checkInDate !== undefined ? validationResult.data.checkInDate : listing.checkInDate;
        const checkOutDate = validationResult.data.checkOutDate !== undefined ? validationResult.data.checkOutDate : listing.checkOutDate;
        if (!checkInDate || !checkOutDate) {
          return NextResponse.json({ error: 'Check-in and check-out dates are required for hotel sharing queries.' }, { status: 400 });
        }
      }
    }
    updateData.requireVerification = requireVerification;

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: updateData,
    });

    // Log admin modifications
    if (isAdmin) {
      await prisma.adminLog.create({
        data: {
          adminId: userId,
          action: 'EDIT_LISTING',
          targetType: 'LISTING',
          targetId: id,
          details: `Admin edited listing details: ${listing.title} -> ${updatedListing.title}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: isAdmin
        ? 'Listing updated successfully.'
        : 'Listing updated and submitted for admin re-approval.',
      listing: {
        ...updatedListing,
        images: typeof updatedListing.images === 'string' ? JSON.parse(updatedListing.images) : updatedListing.images
      },
    });
  } catch (error: any) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

// DELETE: Remove listing (owner or admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Verify user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // 2. Fetch the listing to verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const isOwner = listing.userId === userId;
    const isAdmin = userRole === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden. You do not own this listing.' }, { status: 403 });
    }

    // 3. Delete listing from Prisma
    await prisma.listing.delete({
      where: { id },
    });

    // Log admin deletions
    if (isAdmin) {
      await prisma.adminLog.create({
        data: {
          adminId: userId,
          action: 'DELETE_LISTING',
          targetType: 'LISTING',
          targetId: id,
          details: `Admin deleted listing title: ${listing.title} owned by User ID: ${listing.userId}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
