import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { queryClaude } from '@/lib/claude';
import { ListingCategory, ListingStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { id, price, city, area, category, furnishing } = await req.json();

    const listingPrice = parseFloat(price);
    if (isNaN(listingPrice) || listingPrice <= 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // 1. Query DB for similar listings
    let similarListings = await prisma.listing.findMany({
      where: {
        status: ListingStatus.APPROVED,
        category: category as ListingCategory,
        city: { equals: city, mode: 'insensitive' },
        area: { equals: area, mode: 'insensitive' },
        createdAt: { gte: ninetyDaysAgo },
        id: id ? { not: id } : undefined, // exclude current listing if editing/viewing
      },
      select: { price: true },
    });

    // Fallback: If not enough matches in specific area, look at the whole city
    if (similarListings.length < 3) {
      similarListings = await prisma.listing.findMany({
        where: {
          status: ListingStatus.APPROVED,
          category: category as ListingCategory,
          city: { equals: city, mode: 'insensitive' },
          createdAt: { gte: ninetyDaysAgo },
          id: id ? { not: id } : undefined,
        },
        select: { price: true },
      });
    }

    // Fallback 2: General fallback values if no DB history is present
    const baseMin = category === ListingCategory.ROOMMATE ? 4000 : 10000;
    const baseMax = category === ListingCategory.ROOMMATE ? 12000 : 35000;
    const baseAvg = (baseMin + baseMax) / 2;

    const prices = similarListings.map((l) => l.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : baseMin;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : baseMax;
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length) : baseAvg;

    // 2. Prepare Claude evaluation
    const systemPrompt = `You are an expert Indian rental market analyst. Evaluate the given rent price against the local market stats.
Return ONLY a valid JSON object matching this structure:
{
  "verdict": "BELOW_MARKET" | "FAIR_PRICE" | "ABOVE_MARKET",
  "aiRange": "e.g. ₹12,000 - ₹15,000",
  "explanation": "A one-sentence explanation in friendly English."
}`;

    const prompt = `Evaluate rent of ₹${listingPrice} for:
Category: ${category}
Furnishing: ${furnishing || 'Unfurnished'}
Location: ${area}, ${city}
Market Data (90 days):
- Min Price: ₹${minPrice}
- Max Price: ₹${maxPrice}
- Avg Price: ₹${avgPrice}`;

    // Math calculation for mock fallback
    let verdict: 'BELOW_MARKET' | 'FAIR_PRICE' | 'ABOVE_MARKET' = 'FAIR_PRICE';
    if (listingPrice < avgPrice * 0.88) {
      verdict = 'BELOW_MARKET';
    } else if (listingPrice > avgPrice * 1.12) {
      verdict = 'ABOVE_MARKET';
    }

    const mockAiRange = `₹${Math.round(avgPrice * 0.9).toLocaleString('en-IN')} - ₹${Math.round(avgPrice * 1.1).toLocaleString('en-IN')}`;
    const mockExplanation = verdict === 'BELOW_MARKET' 
      ? `At ₹${listingPrice.toLocaleString('en-IN')}, this listing is significantly below the average market rent of ₹${avgPrice.toLocaleString('en-IN')} for this category in ${area || city}.`
      : verdict === 'ABOVE_MARKET'
      ? `This rent is slightly higher than the local average of ₹${avgPrice.toLocaleString('en-IN')}, likely due to premium location or styling.`
      : `This price aligns perfectly with the standard rate (avg: ₹${avgPrice.toLocaleString('en-IN')}) for ${category?.toLowerCase()} rentals in this locality.`;

    const defaultMockResponse = JSON.stringify({
      verdict,
      aiRange: mockAiRange,
      explanation: mockExplanation,
    });

    const aiText = await queryClaude(prompt, systemPrompt, defaultMockResponse);
    
    let evaluation = { verdict, aiRange: mockAiRange, explanation: mockExplanation };
    try {
      evaluation = JSON.parse(aiText.trim());
    } catch (e) {
      console.warn('Failed to parse AI evaluation response, using math fallback:', aiText);
    }

    return NextResponse.json({
      price: listingPrice,
      min: minPrice,
      max: maxPrice,
      avg: avgPrice,
      sampleSize: similarListings.length,
      ...evaluation,
    });
  } catch (error) {
    console.error('Error in rent estimator API:', error);
    return NextResponse.json({ error: 'Failed to estimate rent' }, { status: 500 });
  }
}
