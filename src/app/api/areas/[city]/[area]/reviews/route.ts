import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ city: string; area: string }> }
) {
  const { city, area } = await context.params;
  const decodedCity = decodeURIComponent(city);
  const decodedArea = decodeURIComponent(area);

  try {
    const reviews = await prisma.areaReview.findMany({
      where: {
        city: decodedCity,
        area: decodedArea,
      },
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

    if (reviews.length === 0) {
      return NextResponse.json({ reviews: [], stats: null });
    }

    const total = reviews.length;
    const avgSafety = reviews.reduce((sum, r) => sum + r.safety, 0) / total;

    const waterCounts: Record<string, number> = { '24_7': 0, 'TANKER': 0, 'LIMITED': 0 };
    const powerCounts: Record<string, number> = { 'RARE': 0, 'OCCASIONAL': 0, 'FREQUENT': 0 };
    const transportCounts: Record<string, number> = { 'EXCELLENT': 0, 'GOOD': 0, 'POOR': 0 };
    const marketCounts: Record<string, number> = { 'WALKING': 0, '10_MIN': 0, 'FAR': 0 };
    const noiseCounts: Record<string, number> = { 'QUIET': 0, 'MODERATE': 0, 'LOUD': 0 };
    const providerCounts: Record<string, number> = {};

    reviews.forEach((r) => {
      if (waterCounts[r.waterSupply] !== undefined) waterCounts[r.waterSupply]++;
      if (powerCounts[r.powerCuts] !== undefined) powerCounts[r.powerCuts]++;
      if (transportCounts[r.transport] !== undefined) transportCounts[r.transport]++;
      if (marketCounts[r.market] !== undefined) marketCounts[r.market]++;
      if (noiseCounts[r.noise] !== undefined) noiseCounts[r.noise]++;
      
      if (r.internetProviders) {
        try {
          const providers = JSON.parse(r.internetProviders);
          if (Array.isArray(providers)) {
            providers.forEach((p: string) => {
              providerCounts[p] = (providerCounts[p] || 0) + 1;
            });
          }
        } catch {}
      }
    });

    const getDominant = (counts: Record<string, number>) => {
      return Object.entries(counts).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    };

    return NextResponse.json({
      reviews,
      stats: {
        total,
        avgSafety: parseFloat(avgSafety.toFixed(1)),
        waterSupply: getDominant(waterCounts),
        powerCuts: getDominant(powerCounts),
        transport: getDominant(transportCounts),
        market: getDominant(marketCounts),
        noise: getDominant(noiseCounts),
        internetProviders: providerCounts,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch area reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ city: string; area: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const { city, area } = await context.params;
  const decodedCity = decodeURIComponent(city);
  const decodedArea = decodeURIComponent(area);

  try {
    const body = await req.json();
    const {
      safety,
      waterSupply,
      powerCuts,
      transport,
      market,
      noise,
      internetProviders,
      comment,
    } = body;

    if (typeof safety !== 'number' || safety < 1 || safety > 5) {
      return NextResponse.json({ error: 'Invalid safety rating' }, { status: 400 });
    }
    if (!['24_7', 'TANKER', 'LIMITED'].includes(waterSupply)) {
      return NextResponse.json({ error: 'Invalid water supply value' }, { status: 400 });
    }
    if (!['RARE', 'OCCASIONAL', 'FREQUENT'].includes(powerCuts)) {
      return NextResponse.json({ error: 'Invalid power cuts value' }, { status: 400 });
    }
    if (!['EXCELLENT', 'GOOD', 'POOR'].includes(transport)) {
      return NextResponse.json({ error: 'Invalid transport value' }, { status: 400 });
    }
    if (!['WALKING', '10_MIN', 'FAR'].includes(market)) {
      return NextResponse.json({ error: 'Invalid market value' }, { status: 400 });
    }
    if (!['QUIET', 'MODERATE', 'LOUD'].includes(noise)) {
      return NextResponse.json({ error: 'Invalid noise value' }, { status: 400 });
    }

    const providersString = internetProviders ? JSON.stringify(internetProviders) : null;

    const review = await prisma.areaReview.upsert({
      where: {
        userId_city_area: {
          userId,
          city: decodedCity,
          area: decodedArea,
        },
      },
      update: {
        safety,
        waterSupply,
        powerCuts,
        transport,
        market,
        noise,
        internetProviders: providersString,
        comment,
      },
      create: {
        userId,
        city: decodedCity,
        area: decodedArea,
        safety,
        waterSupply,
        powerCuts,
        transport,
        market,
        noise,
        internetProviders: providersString,
        comment,
      },
    });

    return NextResponse.json(review);
  } catch (error: any) {
    console.error('Failed to submit area review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
