import {
  validateJob,
  isPowerPlatformJob,
  isIndiaLocation,
  containsNegativeKeywords,
  normalizeUrl,
  isCompanyExcluded,
  isTargetCompany,
  isExperienceMatching
} from '../filters/index.ts';
import { extractSkillTags } from '../tagger.ts';
import { isJobMatchingProfile, extractProfileSkillTags } from '../profiles/profileRegistry.ts';
import { cleanText, cleanJobDescription } from '../utils/textSanitizer.ts';
import type { Job, RawJobListing, JobProfile } from '../types.ts';

export const USER_AGENT = 'PowerPlatformJobRadar/1.0 (+https://github.com/Vishnu1562/Job_Bot)';

export function generateJobId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `job-${Math.abs(hash).toString(16)}`;
}

export function processCandidateJob(
  raw: RawJobListing,
  source: string,
  explicitId?: string,
  profile?: JobProfile
): Job | null {
  if (!validateJob(raw)) return null;
  if (!isIndiaLocation(raw.location)) return null;
  if (containsNegativeKeywords(raw)) return null;

  if (profile) {
    if (isCompanyExcluded(raw.company, profile)) return null;
    if (!isJobMatchingProfile(raw, profile)) return null;
    if (!isExperienceMatching(raw, profile)) return null;
  } else {
    if (!isPowerPlatformJob(raw)) return null;
  }

  const cleanUrl = normalizeUrl(raw.url);
  const id = explicitId || generateJobId(cleanUrl);
  const tags = profile
    ? extractProfileSkillTags(raw.title, raw.description, profile)
    : extractSkillTags(raw.title, raw.description);

  const isTarget = profile ? isTargetCompany(raw.company, profile) : false;

  return {
    id,
    profileId: profile?.id,
    title: cleanText(raw.title),
    company: cleanText(raw.company),
    location: cleanText(raw.location),
    url: cleanUrl,
    tags,
    source,
    description: cleanJobDescription(raw.description || ''),
    publishedAt: raw.publishedAt,
    isTargetCompany: isTarget
  };
}

export async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 10000,
  extraHeaders: Record<string, string> = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, application/xml, text/xml, */*',
        ...extraHeaders
      },
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}
