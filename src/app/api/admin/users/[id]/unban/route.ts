import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@/lib/types';

// POST /api/admin/users/[id]/unban — Clears isBanned flag, restoring access
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const adminId = (session.user as any).id;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (!user.isBanned) {
      return NextResponse.json({ error: 'User is not currently banned.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id },
      data: { isBanned: false },
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'UNBAN_USER',
        targetType: 'USER',
        targetId: id,
        details: `Unbanned user: "${user.email}" (Name: ${user.name || 'None'})`,
      },
    });

    return NextResponse.json({ success: true, message: 'User unbanned. They can now log in again.' });
  } catch (error: any) {
    console.error('Error unbanning user:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
