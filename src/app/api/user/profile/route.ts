import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').optional(),
  image: z.string().url().or(z.literal('')).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters.').or(z.literal('')).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        documentVerified: true,
        documentStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const result = profileSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, image, password } = result.data;

    // Fetch current user details to check for name change
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
      // If name is altered, revoke verified ID badge
      if (currentUser && currentUser.name !== name) {
        updateData.documentVerified = false;
        updateData.documentStatus = 'UNVERIFIED';
        updateData.documentType = null;
        updateData.legalName = null;
        updateData.documentNumber = null;
        updateData.documentUrl = null;
      }
    }
    if (image !== undefined) updateData.image = image;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Delete user from database (cascades automatically delete listings, etc.)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully.',
    });
  } catch (error: any) {
    console.error('Account delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
