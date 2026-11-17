// Backward-compatible barrel re-export.
// Prefer importing directly from './email/index.ts' or './email/mailer.ts'.
export {
  validateMailerConfig,
  sendDigestEmail
} from './email/index.ts';
