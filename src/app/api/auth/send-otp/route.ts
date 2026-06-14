import { NextResponse } from 'next/server';
import { redis, otpRateLimiter } from '@/lib/redis';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check rate limits (resilient to Redis errors)
    let isRateLimitOk = true;
    try {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const rateLimitKey = `otp-limit:${ip}:${normalizedEmail}`;
      const limitRes = await otpRateLimiter.limit(rateLimitKey);
      isRateLimitOk = limitRes.success;
    } catch (redisErr) {
      console.error('[RateLimit Error] Redis rate-limiting failed:', redisErr);
    }
    
    if (!isRateLimitOk) {
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
    try {
      const otpKey = `otp:${normalizedEmail}`;
      await redis.set(otpKey, otp, { ex: 300 });
    } catch (redisErr) {
      console.error('[Redis Error] Failed to store OTP in Redis:', redisErr);
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Failed to generate verification code due to database issues.' }, { status: 500 });
      }
    }

    const isDev = process.env.NODE_ENV === 'development';

    // 5. Send email via unified sendEmail utility
    try {
      await sendEmail({
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
    } catch (emailError: any) {
      console.error('Failed to send verification email:', emailError);
      if (isDev) {
        console.warn(`[DEVELOPMENT] Bypassing email failure. OTP: ${otp}`);
        return NextResponse.json({
          success: true,
          message: `[Dev Mode] Verification code is ${otp} (Email send failed: ${emailError.message})`,
          devOtp: otp,
        });
      }
      return NextResponse.json(
        { error: emailError.message || 'Failed to send verification email.' },
        { status: 500 }
      );
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
