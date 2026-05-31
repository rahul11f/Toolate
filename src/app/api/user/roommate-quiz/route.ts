import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lifestyleProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = user.lifestyleProfile ? JSON.parse(user.lifestyleProfile) : null;

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('Error fetching roommate quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { profile } = body;

    if (!profile || typeof profile !== 'object') {
      return NextResponse.json({ error: 'Invalid profile data' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        lifestyleProfile: JSON.stringify(profile),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Lifestyle compatibility profile saved successfully!',
    });
  } catch (error: any) {
    console.error('Error saving roommate quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
