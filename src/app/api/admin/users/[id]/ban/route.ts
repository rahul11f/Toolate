import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const adminId = (session.user as any).id;

    if (id === adminId) {
      return NextResponse.json({ error: 'You cannot ban yourself.' }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Cascade delete user (removes listings, accounts, and sessions)
    await prisma.user.delete({
      where: { id },
    });

    // Log the action
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'BAN_USER',
        targetType: 'USER',
        targetId: id,
        details: `Deleted/banned user email: "${user.email}" (Name: ${user.name || 'None'})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User banned and deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
