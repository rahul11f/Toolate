import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@/lib/types';

// DELETE /api/admin/users/[id] — Completely removes user from DB (email can be re-used)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const adminId = (session.user as any).id;

    if (id === adminId) {
      return NextResponse.json({ error: 'You cannot delete yourself.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Hard delete — cascades to listings, sessions, accounts, etc.
    await prisma.user.delete({ where: { id } });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'DELETE_USER',
        targetType: 'USER',
        targetId: id,
        details: `Permanently deleted user: "${user.email}" (Name: ${user.name || 'None'})`,
      },
    });

    return NextResponse.json({ success: true, message: 'User permanently deleted. Email can be re-used.' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
