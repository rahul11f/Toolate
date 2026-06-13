import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role } from '@/lib/types';
import { z } from 'zod';
import { feedbackRateLimiter } from '@/lib/redis';

const feedbackSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  subject: z.string().min(3, 'Subject must be at least 3 characters.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

export const dynamic = 'force-dynamic';

// POST: Public submission of feedback/contact queries (Rate-limited)
export async function POST(req: NextRequest) {
  try {
    // Check rate limits
    let isRateLimitOk = true;
    try {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const rateLimitKey = `feedback-limit:${ip}`;
      const { success } = await feedbackRateLimiter.limit(rateLimitKey);
      isRateLimitOk = success;
    } catch (redisErr) {
      console.error('[RateLimit Error] Redis rate-limiting failed for feedback:', redisErr);
    }

    if (!isRateLimitOk) {
      return NextResponse.json(
        { error: 'Too many feedback submissions. Please try again in an hour.' },
        { status: 429 }
      );
    }

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

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully! We will get back to you shortly.',
      feedback,
    });
  } catch (error: any) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// GET: Admins retrieval of feedback list (Paginated)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.feedback.count(),
    ]);

    return NextResponse.json({
      feedback,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
