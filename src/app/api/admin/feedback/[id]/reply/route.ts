import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Admin role required.' }, { status: 403 });
    }

    const body = await req.json();
    const { reply } = body;

    if (!reply || reply.trim().length < 5) {
      return NextResponse.json(
        { error: 'Reply message must be at least 5 characters long.' },
        { status: 400 }
      );
    }

    // Verify feedback exists
    const feedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback record not found.' }, { status: 404 });
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: {
        reply: reply.trim(),
        repliedAt: new Date(),
      },
    });

    // Write audit log
    const adminId = (session.user as any).id;
    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'REPLY_FEEDBACK',
        targetType: 'FEEDBACK',
        targetId: id,
        details: `Replied to feedback from ${feedback.name} (Subject: "${feedback.subject}")`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Reply saved successfully.',
      feedback: updatedFeedback,
    });
  } catch (error: any) {
    console.error('Error replying to feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
