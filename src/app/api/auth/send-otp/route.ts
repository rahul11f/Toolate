import { NextResponse } from 'next/server';
import { redis, otpRateLimiter } from '@/lib/redis';
import { Resend } from 'resend';
import prisma from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check rate limits
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `otp-limit:${ip}:${normalizedEmail}`;
    const { success } = await otpRateLimiter.limit(rateLimitKey);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please try again in 5 minutes.' },
        { status: 429 }
      );
    }

    // 2. Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'Email is already registered.' }, { status: 400 });
    }

    // 3. Generate a 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Store in Upstash Redis (valid for 5 minutes = 300 seconds)
    const otpKey = `otp:${normalizedEmail}`;
    await redis.set(otpKey, otp, { ex: 300 });

    // 5. Send email via Resend
    let emailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const { error: resendError } = await resend.emails.send({
          from: 'Toolate <onboarding@resend.dev>', // Resend sandbox default from address
          to: normalizedEmail,
          subject: 'Your Toolate OTP Verification Code',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #6366f1;">Welcome to Toolate!</h2>
              <p>Your OTP verification code for sign up is:</p>
              <h1 style="background: #f3f4f6; display: inline-block; padding: 10px 20px; letter-spacing: 4px; border-radius: 8px; font-weight: bold; color: #1f2937;">${otp}</h1>
              <p>This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>
            </div>
          `,
        });
        if (resendError) {
          console.error('Failed to send email via Resend:', resendError);
        } else {
          emailSent = true;
        }
      } catch (emailError: any) {
        console.error('Failed to send email via Resend:', emailError);
      }
    } else {
      // Log to console if Resend key is missing (for local testing/fallback)
      console.log('--- DEVELOPMENT OTP ---');
      console.log(`Email: ${normalizedEmail}`);
      console.log(`OTP Code: ${otp}`);
      console.log('----------------------');
    }

    if (!emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Sandbox / Local mode: Verification code generated.',
        otp: otp,
      });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
