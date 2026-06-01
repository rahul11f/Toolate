import { NextResponse } from 'next/server';
import { redis, otpRateLimiter } from '@/lib/redis';
import { Resend } from 'resend';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

const resend = new Resend(process.env.RESEND_API_KEY || '');

// Configure SMTP transport if SMTP user & pass are set
const smtpUser = process.env.SMTP_USER || '';
const smtpPassword = process.env.SMTP_PASSWORD || '';

const smtpTransporter = smtpUser && smtpPassword
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    })
  : null;

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

    // 5. Send email via SMTP (Nodemailer/Gmail) or Resend
    if (smtpTransporter) {
      try {
        await smtpTransporter.sendMail({
          from: `"Toolate" <${smtpUser}>`,
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
      } catch (smtpError: any) {
        console.error('Failed to send email via SMTP:', smtpError);
        return NextResponse.json(
          { error: smtpError.message || 'Failed to send verification email via SMTP.' },
          { status: 500 }
        );
      }
    } else if (process.env.RESEND_API_KEY) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const formattedFrom = fromEmail.includes('<') ? fromEmail : `Toolate <${fromEmail}>`;

        const { error: resendError } = await resend.emails.send({
          from: formattedFrom,
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
          return NextResponse.json(
            { error: resendError.message || 'Failed to send verification email.' },
            { status: 400 }
          );
        }
      } catch (emailError: any) {
        console.error('Failed to send email via Resend:', emailError);
        return NextResponse.json(
          { error: emailError.message || 'Failed to send verification email.' },
          { status: 500 }
        );
      }
    } else {
      console.error('No email sending configuration found.');
      return NextResponse.json(
        { error: 'Email sending configuration (SMTP or Resend) is missing.' },
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
