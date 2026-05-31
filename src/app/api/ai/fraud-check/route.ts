import { NextRequest, NextResponse } from 'next/server';
import { detectFraud } from '@/lib/fraud';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { title, description, price, contactNumber } = await req.json();

    const listingPrice = parseFloat(price) || 0;
    const result = await detectFraud(title, description, listingPrice, contactNumber);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in fraud detector API:', error);
    return NextResponse.json({ error: 'Failed to detect fraud' }, { status: 500 });
  }
}
