import nodemailer from 'nodemailer';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import { logger } from '@/utils/logger';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function assertEmailConfigured(): void {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    throw new AppError('Email verification is not configured', 503);
  }
}

export async function sendVerificationOtp(email: string, name: string, otp: string): Promise<void> {
  assertEmailConfigured();
  const safeName = escapeHtml(name);

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: 'Verify your Quantro account',
    text: `Hi ${name},\n\nYour Quantro verification code is ${otp}.\n\nThis code expires in ${env.EMAIL_OTP_EXPIRY_MINUTES} minutes.\n\nIf you did not create this account, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
        <h2 style="margin-bottom: 12px;">Verify your Quantro account</h2>
        <p>Hi ${safeName},</p>
        <p>Use this one-time code to verify your email address:</p>
        <div style="font-size: 32px; letter-spacing: 8px; font-weight: 700; margin: 24px 0; padding: 18px 24px; background: #f3f4f6; border-radius: 10px; text-align: center;">
          ${otp}
        </div>
        <p>This code expires in ${env.EMAIL_OTP_EXPIRY_MINUTES} minutes.</p>
        <p style="color: #6b7280; font-size: 13px;">If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });

  logger.info('Verification OTP email sent', { email });
}
