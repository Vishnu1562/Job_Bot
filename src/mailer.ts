import nodemailer from 'nodemailer';
import type { MailerConfig } from './types.ts';

export function validateMailerConfig(env: Record<string, string | undefined> = process.env): MailerConfig {
  const senderEmail = env.SENDER_EMAIL?.trim();
  const rawPassword = env.SENDER_PASSWORD?.trim();
  const recipientEmail = env.RECIPIENT_EMAIL?.trim();

  if (!senderEmail) {
    throw new Error('Missing required environment variable: SENDER_EMAIL');
  }
  if (!rawPassword) {
    throw new Error('Missing required environment variable: SENDER_PASSWORD');
  }
  if (!recipientEmail) {
    throw new Error('Missing required environment variable: RECIPIENT_EMAIL');
  }

  // Google App Passwords are 16 lowercase characters often formatted with spaces: 'abcd efgh ijkl mnop'
  const senderPassword = rawPassword.replace(/\s+/g, '');

  return {
    senderEmail,
    senderPassword,
    recipientEmail
  };
}

export async function sendDigestEmail(
  subject: string,
  html: string,
  overrideConfig?: MailerConfig
): Promise<void> {
  const config = overrideConfig || validateMailerConfig();

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // upgrades via STARTTLS
    auth: {
      user: config.senderEmail,
      pass: config.senderPassword
    }
  });

  const mailOptions = {
    from: `"Power Platform Job Radar" <${config.senderEmail}>`,
    to: config.recipientEmail,
    subject,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Mailer] Email dispatched successfully! MessageId: ${info.messageId}`);
}
