import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    // 1. Payments made by the user (as Tenant)
    const paymentsMade = await prisma.rentPayment.findMany({
      where: {
        tenantUserId: userId,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 2. Payments received for listings owned by the user (as Landlord)
    const paymentsReceived = await prisma.rentPayment.findMany({
      where: {
        listing: {
          userId: userId,
        },
      },
      include: {
        tenant: {
          select: {
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      paymentsMade,
      paymentsReceived,
    });
  } catch (error: any) {
    console.error('Failed to fetch user payments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
