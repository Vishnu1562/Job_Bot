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

  if (!rawSenderEmail) {
    throw new Error('Missing required environment variable: SENDER_EMAIL');
  }
  if (!rawPassword) {
    throw new Error('Missing required environment variable: SENDER_PASSWORD');
  }
  if (!rawRecipientEmail) {
    throw new Error('Missing required environment variable: RECIPIENT_EMAIL');
  }

  // Auto-detect Resend by username ('resend'), API key prefix ('re_'), or explicit host
  const isResend =
    (env.SMTP_HOST?.includes('resend.com') ?? false) ||
    rawSenderEmail.toLowerCase() === 'resend' ||
    rawPassword.startsWith('re_');

  // Auto-detect Gmail by email domain or explicit host
  const isGmail =
    (env.SMTP_HOST?.includes('gmail.com') ?? false) ||
    rawSenderEmail.toLowerCase().endsWith('@gmail.com');

  let defaultHost = 'smtp-relay.brevo.com';
  let defaultPort = '587';

  if (isResend) {
    defaultHost = 'smtp.resend.com';
    defaultPort = '465';
  } else if (isGmail) {
    defaultHost = 'smtp.gmail.com';
    defaultPort = '465';
  }

  const smtpHost = env.SMTP_HOST?.trim() || defaultHost;
  const smtpPort = parseInt(env.SMTP_PORT?.trim() || defaultPort, 10);

  const recipientEmail = cleanEmail(rawRecipientEmail);
  const senderPassword = rawPassword.replace(/\s+/g, '');

  let authUser = rawSenderEmail;
  let fromEmail = cleanEmail(env.FROM_EMAIL?.trim() || '');

  if (isResend) {
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
  overrideConfig?: Partial<MailerConfig>
): Promise<void> {
  const baseConfig = validateMailerConfig();
  const config: MailerConfig = {
    ...baseConfig,
    ...overrideConfig
  };

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
    from: `"Job Radar" <${config.fromEmail}>`,
    to: config.recipientEmail,
    subject,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Mailer] Email dispatched to ${config.recipientEmail} via ${config.smtpHost}! MessageId: ${info.messageId}`);
}
