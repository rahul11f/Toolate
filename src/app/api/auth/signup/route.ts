import { NextResponse } from 'next/server';
import { redis, signupRateLimiter } from '@/lib/redis';
import { verifyRecaptcha } from '@/lib/recaptcha';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Zod schema for signup validation
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  otp: z.string().length(6, 'OTP must be 6 digits.'),
  recaptchaToken: z.string().min(1, 'reCAPTCHA token is required.'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Validate request body fields
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { name, email, password, otp, recaptchaToken } = validationResult.data;
    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check rate limits
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `signup-limit:${ip}`;
    const { success: isRateLimitOk } = await signupRateLimiter.limit(rateLimitKey);
    if (!isRateLimitOk) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again in an hour.' },
        { status: 429 }
      );
    }

    // 3. Verify reCAPTCHA token
    const isCaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isCaptchaValid) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed. Please try again.' }, { status: 400 });
    }

    // 4. Verify OTP from Redis
    const otpKey = `otp:${normalizedEmail}`;
    const storedOtp = await redis.get(otpKey);
    
    if (!storedOtp) {
      return NextResponse.json({ error: 'OTP code has expired or is invalid.' }, { status: 400 });
    }

    if (String(storedOtp).trim() !== String(otp).trim()) {
      return NextResponse.json({ error: 'Incorrect OTP code.' }, { status: 400 });
    }

    // 5. Check if user already exists (just to double check concurrency)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'Email is already registered.' }, { status: 400 });
    }

    // 6. Delete OTP key since it was successfully verified
    await redis.del(otpKey);

    // 7. Hash the user's password
    const passwordHash = await bcrypt.hash(password, 10);

    // 8. Create the user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: 'USER',
        emailVerified: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: newUser,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
