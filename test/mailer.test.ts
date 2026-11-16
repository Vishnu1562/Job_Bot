import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateMailerConfig } from '../src/mailer.ts';

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

  it('succeeds when all 3 credentials are provided, defaulting to Brevo relay', () => {
    const config = validateMailerConfig({
      SENDER_EMAIL: 'sender@example.com',
      SENDER_PASSWORD: 'abcd efgh ijkl mnop',
      RECIPIENT_EMAIL: 'receiver@gmail.com'
    });
    assert.strictEqual(config.senderEmail, 'sender@example.com');
    assert.strictEqual(config.senderPassword, 'abcdefghijklmnop'); // whitespace stripped
    assert.strictEqual(config.recipientEmail, 'receiver@gmail.com');
    assert.strictEqual(config.smtpHost, 'smtp-relay.brevo.com');
    assert.strictEqual(config.smtpPort, 587);
  });

  it('allows custom SMTP_HOST and SMTP_PORT', () => {
    const config = validateMailerConfig({
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '465',
      SENDER_EMAIL: 'sender@gmail.com',
      SENDER_PASSWORD: 'secretpassword',
      RECIPIENT_EMAIL: 'receiver@gmail.com'
    });
    assert.strictEqual(config.smtpHost, 'smtp.gmail.com');
    assert.strictEqual(config.smtpPort, 465);
  });
});
