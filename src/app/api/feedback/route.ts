import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@/lib/types';
import { z } from 'zod';

const feedbackSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  subject: z.string().min(3, 'Subject must be at least 3 characters.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

export const dynamic = 'force-dynamic';

// POST: Public submission of feedback/contact queries
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = feedbackSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        subject: result.data.subject,
        message: result.data.message,
      },
    });

    return NextResponse.json({ success: true, message: 'Message sent successfully! We will get back to you shortly.', feedback });
  } catch (error: any) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// GET: Admins retrieval of feedback list
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 401 });
    }

    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(feedback);
  } catch (error: any) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
