import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const { id: listingId } = await context.params;

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const isLandlord = listing.userId === userId;

    const payments = await prisma.rentPayment.findMany({
      where: isLandlord
        ? { listingId }
        : { listingId, tenantUserId: userId },
      include: {
        tenant: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Failed to fetch payments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const { id: listingId } = await context.params;

  try {
    const body = await req.json();

    // Check if it is a confirmation by landlord
    if (body.paymentId && body.action === 'confirm') {
      const { paymentId } = body;

      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { userId: true },
      });

      if (!listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }

      if (listing.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden: Only the landlord can confirm' }, { status: 403 });
      }

      const updatedPayment = await prisma.rentPayment.update({
        where: { id: paymentId },
        data: {
          landlordConfirmed: true,
        },
      });

      return NextResponse.json(updatedPayment);
    }

    // Otherwise, it is a tenant submitting/updating a payment proof
    const { month, year, amountPaid, upiScreenshotUrl } = body;

    if (typeof month !== 'number' || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
    }
    if (typeof year !== 'number' || year < 2000) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }
    if (typeof amountPaid !== 'number' || amountPaid <= 0) {
      return NextResponse.json({ error: 'Invalid amount paid' }, { status: 400 });
    }

    // Check if payment already exists
    const existing = await prisma.rentPayment.findFirst({
      where: {
        listingId,
        tenantUserId: userId,
        month,
        year,
      },
    });

    let payment;
    if (existing) {
      payment = await prisma.rentPayment.update({
        where: { id: existing.id },
        data: {
          amountPaid,
          upiScreenshotUrl: upiScreenshotUrl || existing.upiScreenshotUrl,
          landlordConfirmed: false,
        },
      });
    } else {
      payment = await prisma.rentPayment.create({
        data: {
          listingId,
          tenantUserId: userId,
          month,
          year,
          amountPaid,
          upiScreenshotUrl,
        },
      });
    }

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error('Failed to submit payment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
