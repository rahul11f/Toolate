import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER || '';
const smtpPassword = process.env.SMTP_PASSWORD || '';
const smtpFrom = process.env.SMTP_FROM || '"Toolate" <noreply@toolate.com>';

const resend = new Resend(process.env.RESEND_API_KEY || '');

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const normalizedEmail = to.trim().toLowerCase();

  // 1. Try SMTP if credentials are provided
  if (smtpUser && smtpPassword) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost || 'smtp-relay.brevo.com',
        port: smtpPort,
        secure: smtpPort === 465, // SSL
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: normalizedEmail,
        subject,
        html,
      });

      return { success: true, method: 'smtp' };
    } catch (smtpError: unknown) {
      console.error('[Mail Utility] Failed to send email via SMTP (possibly IP unauthorized). Falling back to Resend...', smtpError);
      // Do not throw here, allow it to fall back to Resend API
    }
  }

  // 2. Fallback to Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const formattedFrom = fromEmail.includes('<') ? fromEmail : `Toolate <${fromEmail}>`;

      const { data, error } = await resend.emails.send({
        from: formattedFrom,
        to: normalizedEmail,
        subject,
        html,
      });

      if (error) {
        console.error('[Mail Utility] Failed to send email via Resend:', error);
        throw new Error(error.message);
      }

      return { success: true, method: 'resend', data };
    } catch (resendError: unknown) {
      console.error('[Mail Utility] Error sending email via Resend:', resendError);
      throw resendError;
    }
  }

  throw new Error('No email configuration found. Please set SMTP or Resend credentials in environment variables.');
}
