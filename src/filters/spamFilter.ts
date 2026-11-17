import type { RawJobListing } from '../types.ts';

export const NEGATIVE_KEYWORDS = [
  'unpaid',
  'unpaid internship',
  'excel only',
  'data entry',
  'typing',
  'transcription',
  'commission only',
  'recruiter spam',
  'survey taker',
  'copy paste'
];

export function validateJob(job: RawJobListing): boolean {
  if (!job || typeof job !== 'object') return false;
  if (!job.title || typeof job.title !== 'string' || job.title.trim() === '') return false;
  if (!job.url || typeof job.url !== 'string' || !job.url.startsWith('http')) return false;
  return true;
}

export function containsNegativeKeywords(job: RawJobListing): boolean {
  const text = `${job.title} ${job.description || ''}`.toLowerCase();
  return NEGATIVE_KEYWORDS.some((neg) => text.includes(neg));
}

export function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Strip common tracking and referral query parameters
    const paramsToStrip = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
      'source',
      'tracker',
      'gh_src'
    ];
    paramsToStrip.forEach((param) => parsed.searchParams.delete(param));
    // If no params left, remove the trailing '?'
    const query = parsed.searchParams.toString();
    return `${parsed.origin}${parsed.pathname}${query ? `?${query}` : ''}`;
  } catch {
    return rawUrl.trim();
  }
}
