import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/mail';
import { otpRateLimiter } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Rate limiting (resilient to Redis failures)
    let isRateLimitOk = true;
    try {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const rateLimitKey = `forgot-password-limit:${ip}:${normalizedEmail}`;
      const limitRes = await otpRateLimiter.limit(rateLimitKey);
      isRateLimitOk = limitRes.success;
    } catch (redisErr) {
      console.error('[RateLimit Error] Redis rate-limiting failed:', redisErr);
    }

    if (!isRateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in 5 minutes.' },
        { status: 429 }
      );
    }

    // 2. Query user in DB
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // To prevent email enumeration attacks, if user does not exist,
    // we return a success status to the client without executing any email dispatch.
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account is registered with this email, a password reset link has been sent.',
      });
    }

    // 3. Generate a secure random token (64-character hex string)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour expiration

    // 4. Save PasswordResetToken (first delete any old token to keep DB clean)
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expires,
      },
    });

    // 5. Send the email with the reset link
    const baseUrl = process.env.NEXTAUTH_URL 
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
        <h2 style="color: #4f46e5; text-align: center;">Reset Your Toolate Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your Toolate account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #64748b;">This link will expire in 1 hour. If you did not request this, please ignore this email; your password will remain secure and unchanged.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Toolate Inc. | Prestige Tech Park, Bangalore, KA, India</p>
      </div>
    `;

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Reset your Toolate password',
        html: emailHtml,
      });
    } catch (emailError: any) {
      console.error('[Forgot Password API] Failed to send email:', emailError);
      
      // If we are in local development, bypass SMTP failures by logging the reset link to the console.
      if (process.env.NODE_ENV === 'development') {
        console.warn('\n========================================================================');
        console.warn(`[DEVELOPMENT] SMTP Send Failed: ${emailError.message}`);
        console.warn(`[DEVELOPMENT] Bypassing delivery. Reset URL for ${normalizedEmail} is:`);
        console.warn(`👉 ${resetUrl}`);
        console.warn('========================================================================\n');
        
        return NextResponse.json({
          success: true,
          message: 'If an account is registered with this email, a password reset link has been sent.',
        });
      }

      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account is registered with this email, a password reset link has been sent.',
    });
  } catch (error: any) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
