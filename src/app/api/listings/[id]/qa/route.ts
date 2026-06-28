import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await context.params;

  try {
    const qas = await prisma.listingQA.findMany({
      where: { listingId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(qas);
  } catch (error: any) {
    console.error('Failed to fetch QAs:', error);
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

    // Check if it is an answer submission
    if (body.questionId && typeof body.answer === 'string') {
      const { questionId, answer } = body;

      // Verify listing owner
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { userId: true },
      });

      if (!listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }

      if (listing.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden: Only the owner can answer' }, { status: 403 });
      }

      const updatedQA = await prisma.listingQA.update({
        where: { id: questionId },
        data: {
          answer: answer.trim(),
          answeredAt: new Date(),
        },
      });

      // Notify the user who asked the question
      if (updatedQA.askedBy !== userId) {
        await prisma.notification.create({
          data: {
            userId: updatedQA.askedBy,
            title: 'Your question was answered',
            message: `The landlord has answered your question.`,
          }
        });
      }

      return NextResponse.json(updatedQA);
    }

    // Check if it is an upvote action
    if (body.questionId && body.action === 'upvote') {
      const { questionId } = body;
      const updatedQA = await prisma.listingQA.update({
        where: { id: questionId },
        data: {
          upvotes: {
            increment: 1,
          },
        },
      });
      return NextResponse.json(updatedQA);
    }

    // Otherwise, it is a new question submission
    const { question } = body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    const newQA = await prisma.listingQA.create({
      data: {
        listingId,
        askedBy: userId,
        question: question.trim(),
      },
    });

    // Notify the listing owner
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true, title: true }
    });
    
    if (listing && listing.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: listing.userId,
          title: 'New Question Received',
          message: `Someone asked a question about ${listing.title}.`,
        }
      });
    }

    return NextResponse.json(newQA);
  } catch (error: any) {
    console.error('Failed to submit QA:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
