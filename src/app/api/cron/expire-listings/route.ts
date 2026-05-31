import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import { ListingStatus } from '@/lib/types';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function GET(req: Request) {
  try {
    // Basic authorization check: verify CRON_SECRET if set in env
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
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

    // Set status to EXPIRED in database
    const updatedIds = expiredListings.map(l => l.id);
    await prisma.listing.updateMany({
      where: { id: { in: updatedIds } },
      data: { status: 'EXPIRED' },
    });

    // Send warning/expiry notification email to landlords via Resend
    let emailsSent = 0;
    if (process.env.RESEND_API_KEY) {
      for (const listing of expiredListings) {
        if (!listing.user.email) continue;
        try {
          await resend.emails.send({
            from: 'Toolate <onboarding@resend.dev>',
            to: listing.user.email,
            subject: `Your Toolate Listing has Expired: "${listing.title}"`,
            html: `
              <h3>Hello ${listing.user.name || 'Landlord'},</h3>
              <p>Your property advertisement <strong>"${listing.title}"</strong> has expired after its 60-day visibility window.</p>
              <p>The listing is no longer public. If the room or house is still available, you can renew it at any time from your Toolate Dashboard to keep it active for another 60 days.</p>
              <p>Go to your <a href="${process.env.NEXTAUTH_URL || 'https://toolate.vercel.app'}/dashboard">Dashboard</a> and click "Renew Listing".</p>
              <br/>
              <p>Best regards,<br/>The Toolate Team</p>
            `,
          });
          emailsSent++;
        } catch (emailErr) {
          console.error(`Failed to send expiry email for listing ${listing.id}:`, emailErr);
        }
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
