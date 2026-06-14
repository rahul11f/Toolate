import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import AreaReviewsClient from './AreaReviewsClient';

export const dynamic = 'force-dynamic';

interface AreaReviewsPageProps {
  params: Promise<{
    city: string;
    area: string;
  }>;
}

export default async function AreaReviewsPage({ params }: AreaReviewsPageProps) {
  const { city, area } = await params;
  const decodedCity = decodeURIComponent(city);
  const decodedArea = decodeURIComponent(area);

  // Fetch reviews from database
  const reviews = await prisma.areaReview.findMany({
    where: {
      city: decodedCity,
      area: decodedArea,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;
  const currentUserId = session?.user ? (session.user as any).id : null;

  // Find if current user already reviewed
  const currentUserReview = currentUserId
    ? reviews.find((r) => r.userId === currentUserId) || null
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AreaReviewsClient
        city={decodedCity}
        area={decodedArea}
        initialReviews={reviews as any}
        isAuthenticated={isAuthenticated}
        currentUserReview={currentUserReview as any}
      />
    </div>
  );
}
