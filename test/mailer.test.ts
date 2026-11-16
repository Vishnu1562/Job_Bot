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
    assert.strictEqual(config.authUser, 'sender@example.com');
    assert.strictEqual(config.fromEmail, 'sender@example.com');
  });

  it('handles Resend SMTP host and automatically sets valid fromEmail (onboarding@resend.dev)', () => {
    const config = validateMailerConfig({
      SMTP_HOST: 'smtp.resend.com',
      SENDER_EMAIL: 'resend',
      SENDER_PASSWORD: 're_1234567890',
      RECIPIENT_EMAIL: 'receiver@gmail.com'
    });
    assert.strictEqual(config.smtpHost, 'smtp.resend.com');
    assert.strictEqual(config.authUser, 'resend');
    assert.strictEqual(config.fromEmail, 'onboarding@resend.dev', 'Resend must use a valid email domain in FROM header');
    assert.strictEqual(config.smtpPort, 465);
  });

  it('auto-detects Resend from SENDER_EMAIL="resend" or SENDER_PASSWORD starting with "re_" even without SMTP_HOST', () => {
    const config = validateMailerConfig({
      SENDER_EMAIL: 'resend',
      SENDER_PASSWORD: 're_abcdef123456',
      RECIPIENT_EMAIL: 'receiver@gmail.com'
    });
    assert.strictEqual(config.smtpHost, 'smtp.resend.com');
    assert.strictEqual(config.authUser, 'resend');
    assert.strictEqual(config.fromEmail, 'onboarding@resend.dev');
    assert.strictEqual(config.smtpPort, 465);
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
    assert.strictEqual(config.fromEmail, 'sender@gmail.com');
  });

  it('auto-detects Gmail from SENDER_EMAIL ending with @gmail.com without requiring SMTP_HOST (AUTH-001)', () => {
    const config = validateMailerConfig({
      SENDER_EMAIL: 'radarbotalerts@gmail.com',
      SENDER_PASSWORD: 'abcd efgh ijkl mnop',
      RECIPIENT_EMAIL: 'receiver@gmail.com'
    });
    assert.strictEqual(config.smtpHost, 'smtp.gmail.com');
    assert.strictEqual(config.smtpPort, 465);
    assert.strictEqual(config.authUser, 'radarbotalerts@gmail.com');
    assert.strictEqual(config.fromEmail, 'radarbotalerts@gmail.com');
    assert.strictEqual(config.senderPassword, 'abcdefghijklmnop');
  });
});
