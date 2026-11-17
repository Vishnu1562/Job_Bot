// Backward-compatible barrel re-export.
// Prefer importing directly from './email/index.ts' or './email/template.ts'.
export {
  generateEmailDigestHtml,
  escapeHtml
} from './email/index.ts';
