import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

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

    const currentMonth = new Date().getMonth(); // 0 = Jan, 9 = Oct
    let seasonName = 'Peak Rental Demand Season';
    let seasonDetails = 'October/January high-demand periods are here. Rents typically spike and properties fill up 3x faster.';

    if (currentMonth === 9) {
      seasonName = 'Festive Peak Moving Season (October)';
      seasonDetails = 'Due to Dussehra, Diwali, and mid-term job shifts, rental demands have spiked across major cities. Secure your rental property now to avoid last-minute price jumps!';
    } else if (currentMonth === 0) {
      seasonName = 'New Year Moving Peak (January)';
      seasonDetails = 'January marks the highest influx of new graduates and job relocations in India. Listings are filling up 3x faster than usual.';
    }

    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
      },
      select: {
        email: true,
        name: true,
      },
    });

    let emailsSent = 0;
    if (process.env.RESEND_API_KEY && users.length > 0) {
      for (const user of users) {
        if (!user.email) continue;
        try {
          await resend.emails.send({
            from: 'Toolate Alerts <onboarding@resend.dev>',
            to: user.email,
            subject: `🚨 ALERT: ${seasonName} is Live!`,
            html: `
              <h3>Hello ${user.name || 'User'},</h3>
              <p>This is a seasonal market alert from <strong>Toolate</strong>.</p>
              <p>${seasonDetails}</p>
              <p><strong>What you should do:</strong></p>
              <ul>
                <li><strong>Tenants:</strong> Start searching and coordinate with landlords immediately. Check out coordinates and bypass brokers to save money.</li>
                <li><strong>Landlords:</strong> Renew your expired listings or post new vacancies today to get maximum visibility during this high-traffic week.</li>
              </ul>
              <p>Visit <a href="${process.env.NEXTAUTH_URL || 'https://toolate.vercel.app'}">Toolate</a> to find or list properties.</p>
              <br/>
              <p>Best regards,<br/>The Toolate Team</p>
            `,
          });
          emailsSent++;
        } catch (emailErr) {
          console.error(`Failed to send alert email to ${user.email}:`, emailErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      usersCount: users.length,
      emailsSent,
    });
  } catch (error: any) {
    console.error('Cron Festival Alert Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
