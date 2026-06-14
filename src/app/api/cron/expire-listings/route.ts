import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ListingStatus } from '@/lib/types';
import { sendEmail } from '@/lib/mail';

export async function GET(req: Request) {
  try {
    // Authorization check: verify CRON_SECRET via query parameter or Authorization Bearer header
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorized = cronSecret && 
      (secret === cronSecret || authHeader === `Bearer ${cronSecret}`);

    if (process.env.NODE_ENV === 'production' && !isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Find all active/pending listings that have expired
    const expiredListings = await prisma.listing.findMany({
      where: {
        expiresAt: { lte: now },
        status: { in: [ListingStatus.APPROVED, ListingStatus.PENDING] },
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    if (expiredListings.length === 0) {
      return NextResponse.json({ message: 'No expired listings found.' });
    }

    // Hard-delete expired listings from database
    const updatedIds = expiredListings.map(l => l.id);
    await prisma.listing.deleteMany({
      where: { id: { in: updatedIds } },
    });

    // Send warning/expiry notification email to landlords
    let emailsSent = 0;
    for (const listing of expiredListings) {
      if (!listing.user.email) continue;
      try {
        await sendEmail({
          to: listing.user.email,
          subject: `Your Toolate Listing has Expired: "${listing.title}"`,
          html: `
            <h3>Hello ${listing.user.name || 'Landlord'},</h3>
            <p>Your property advertisement <strong>"${listing.title}"</strong> has expired and has been removed from Toolate.</p>
            <p>If the property is still available, you can create a new listing at any time from your Toolate Dashboard.</p>
            <p>Go to your <a href="${process.env.NEXTAUTH_URL || 'https://toolate.vercel.app'}/dashboard">Dashboard</a> to manage your properties.</p>
            <br/>
            <p>Best regards,<br/>The Toolate Team</p>
          `,
        });
        emailsSent++;
      } catch (emailErr) {
        console.error(`Failed to send expiry email for listing ${listing.id}:`, emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      expiredCount: expiredListings.length,
      emailsSent,
    });
  } catch (error: any) {
    console.error('Cron Expire Listings Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
