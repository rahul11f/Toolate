import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1 star.').max(5, 'Rating cannot exceed 5 stars.'),
  comment: z.string().min(3, 'Review comment must be at least 3 characters.'),
});

export const dynamic = 'force-dynamic';

// GET: Retrieve all reviews for a listing
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;

    const reviews = await prisma.review.findMany({
      where: { listingId },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST: Add a new review to a listing (requires authentication)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;

    // Verify user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    // Optional check: user cannot review their own listing
    if (listing.userId === userId) {
      return NextResponse.json({ error: 'You cannot review your own listing.' }, { status: 400 });
    }

    // Check if user already reviewed this listing
    const existingReview = await prisma.review.findFirst({
      where: { listingId, userId },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this listing.' }, { status: 400 });
    }

    // Validate body
    const body = await req.json();
    const result = reviewSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        rating: result.data.rating,
        comment: result.data.comment,
        listingId,
        userId,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
