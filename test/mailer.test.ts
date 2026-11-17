import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateMailerConfig } from '../src/email/mailer.ts';

describe('[NF-003 & AUTH-001] Mailer Configuration Validation', () => {
  it('throws descriptive error if SENDER_EMAIL is missing', () => {
    assert.throws(
      () => validateMailerConfig({ SENDER_EMAIL: '', SENDER_PASSWORD: 'pass', RECIPIENT_EMAIL: 'dest@example.com' }),
      /Missing required environment variable: SENDER_EMAIL/
    );
  });

  it('throws descriptive error if SENDER_PASSWORD is missing', () => {
    assert.throws(
      () => validateMailerConfig({ SENDER_EMAIL: 'sender@example.com', SENDER_PASSWORD: '', RECIPIENT_EMAIL: 'dest@example.com' }),
      /Missing required environment variable: SENDER_PASSWORD/
    );
  });

  it('throws descriptive error if RECIPIENT_EMAIL is missing', () => {
    assert.throws(
      () => validateMailerConfig({ SENDER_EMAIL: 'sender@example.com', SENDER_PASSWORD: 'pass', RECIPIENT_EMAIL: '' }),
      /Missing required environment variable: RECIPIENT_EMAIL/
    );
  });

  it('succeeds when all 3 credentials are provided, defaulting to Gmail SMTP (AUTH-001)', () => {
    const config = validateMailerConfig({
      SENDER_EMAIL: 'sender@gmail.com',
      SENDER_PASSWORD: 'abcd efgh ijkl mnop',
      RECIPIENT_EMAIL: 'receiver@gmail.com'
    });
    assert.strictEqual(config.senderEmail, 'sender@gmail.com');
    assert.strictEqual(config.senderPassword, 'abcdefghijklmnop'); // whitespace stripped
    assert.strictEqual(config.recipientEmail, 'receiver@gmail.com');
    assert.strictEqual(config.smtpHost, 'smtp.gmail.com');
    assert.strictEqual(config.smtpPort, 465);
    assert.strictEqual(config.authUser, 'sender@gmail.com');
    assert.strictEqual(config.fromEmail, 'sender@gmail.com');
  });

  it('allows custom SMTP_HOST and SMTP_PORT overrides', () => {
    const config = validateMailerConfig({
      SMTP_HOST: 'mail.customserver.com',
      SMTP_PORT: '587',
      SENDER_EMAIL: 'custom@customserver.com',
      SENDER_PASSWORD: 'secretpassword',
      RECIPIENT_EMAIL: 'receiver@gmail.com'
    });
    assert.strictEqual(config.smtpHost, 'mail.customserver.com');
    assert.strictEqual(config.smtpPort, 587);
    assert.strictEqual(config.fromEmail, 'custom@customserver.com');
  });
});
