import nodemailer from 'nodemailer';
import type { MailerConfig } from './types.ts';

function cleanEmail(val: string): string {
  if (!val) return '';
  return val.replace(/[<>"]/g, '').trim();
}

export function validateMailerConfig(env: Record<string, string | undefined> = process.env): MailerConfig {
  const rawSenderEmail = env.SENDER_EMAIL?.trim();
  const rawPassword = env.SENDER_PASSWORD?.trim();
  const rawRecipientEmail = env.RECIPIENT_EMAIL?.trim();
  const smtpHost = env.SMTP_HOST?.trim() || 'smtp-relay.brevo.com';

  if (!rawSenderEmail) {
    throw new Error('Missing required environment variable: SENDER_EMAIL');
  }
  if (!rawPassword) {
    throw new Error('Missing required environment variable: SENDER_PASSWORD');
  }
  if (!rawRecipientEmail) {
    throw new Error('Missing required environment variable: RECIPIENT_EMAIL');
  }

  // Resend uses 465 (SSL) or 587; standard relays use 587 (STARTTLS)
  const defaultPort = smtpHost.includes('resend.com') ? '465' : '587';
  const smtpPort = parseInt(env.SMTP_PORT?.trim() || defaultPort, 10);

  const recipientEmail = cleanEmail(rawRecipientEmail);
  const senderPassword = rawPassword.replace(/\s+/g, '');

  let authUser = rawSenderEmail;
  let fromEmail = cleanEmail(env.FROM_EMAIL?.trim() || '');

  if (smtpHost.includes('resend.com')) {
    authUser = 'resend';
    if (!fromEmail) {
      fromEmail = 'onboarding@resend.dev';
    }
  } else {
    if (!fromEmail) {
      fromEmail = cleanEmail(rawSenderEmail);
    }
  }

  return {
    senderEmail: rawSenderEmail,
    senderPassword,
    recipientEmail,
    smtpHost,
    smtpPort,
    fromEmail,
    authUser
  };
}

export async function sendDigestEmail(
  subject: string,
  html: string,
  overrideConfig?: MailerConfig
): Promise<void> {
  const config = overrideConfig || validateMailerConfig();

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.authUser,
      pass: config.senderPassword
    }
  });

  const mailOptions = {
    from: `"Power Platform Job Radar" <${config.fromEmail}>`,
    to: config.recipientEmail,
    subject,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Mailer] Email dispatched successfully via ${config.smtpHost}! MessageId: ${info.messageId}`);
}
