import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { otpRateLimiter } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: 'All fields (email, token, password) are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // 1. Check rate limits (to prevent token brute-forcing)
    let isRateLimitOk = true;
    try {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const rateLimitKey = `reset-pwd-limit:${ip}`;
      const limitRes = await otpRateLimiter.limit(rateLimitKey);
      isRateLimitOk = limitRes.success;
    } catch (redisErr) {
      console.error('[RateLimit Error] Redis rate-limiting failed:', redisErr);
    }
    
    if (!isRateLimitOk) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // 2. Find the reset token in the database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset link.' },
        { status: 400 }
      );
    }

    // 2. Check if token is expired
    if (new Date() > resetToken.expires) {
      // Clean up the expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return NextResponse.json(
        { error: 'Password reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // 3. Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // 4. Hash new password and update user record
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash },
    });

    // 5. Delete the token (and any other tokens for this email) to prevent reuse
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
