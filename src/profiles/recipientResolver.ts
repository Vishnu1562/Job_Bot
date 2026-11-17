/**
 * Resolves profile recipients by combining the default recipient (e.g. RECIPIENT_EMAIL)
 * with the profile-specific recipient (e.g. RECIPIENT_EMAIL_POWERPLATFORM, RECIPIENT_EMAIL_FULLSTACK, RECIPIENT_EMAIL_JAVA),
 * deduplicating case-insensitively, trimming whitespace/quotes, and falling back gracefully.
 */
export function resolveProfileRecipients(
  defaultRecipient?: string,
  profileRecipient?: string
): string {
  const result: string[] = [];
  const seen = new Set<string>();

  const candidates = [defaultRecipient, profileRecipient];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const parts = candidate.split(',');
    for (const raw of parts) {
      const cleaned = raw.replace(/[<>"]/g, '').trim();
      if (!cleaned) continue;

      const lower = cleaned.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        result.push(cleaned);
      }
    }
  }

  return result.join(', ');
}
