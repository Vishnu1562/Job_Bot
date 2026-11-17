import nodemailer from 'nodemailer';
import type { MailerConfig } from '../types.ts';

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

  // Pure Gmail SMTP default (smtp.gmail.com:465 SSL)
  const defaultHost = 'smtp.gmail.com';
  const defaultPort = '465';

  const smtpHost = env.SMTP_HOST?.trim() || defaultHost;
  const smtpPort = parseInt(env.SMTP_PORT?.trim() || defaultPort, 10);

  const recipientEmail = cleanEmail(rawRecipientEmail);
  const senderPassword = rawPassword.replace(/\s+/g, '');

  const authUser = rawSenderEmail;
  const fromEmail = cleanEmail(env.FROM_EMAIL?.trim() || '') || cleanEmail(rawSenderEmail);

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
  overrideConfig?: Partial<MailerConfig>,
  text?: string
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
    headers: {
      'Auto-Submitted': 'auto-generated',
      'X-Auto-Response-Suppress': 'OOF, AutoReply'
    },
    ...(text ? { text } : {}),
    html
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Mailer] Email dispatched to ${config.recipientEmail} via ${config.smtpHost}! MessageId: ${info.messageId}`);
}
