import { XMLParser } from 'fast-xml-parser';
import {
  validateJob,
  isPowerPlatformJob,
  isIndiaLocation,
  containsNegativeKeywords,
  normalizeUrl
} from './filter.ts';
import { extractSkillTags } from './tagger.ts';
import type { Job, RawJobListing } from './types.ts';

const USER_AGENT = 'PowerPlatformJobRadar/1.0 (+https://github.com/Vishnu1562/Job_Bot)';

function generateJobId(url: string): string {
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `job-${Math.abs(hash).toString(16)}`;
}

function processCandidateJob(
  raw: RawJobListing,
  source: string,
  explicitId?: string
): Job | null {
  if (!validateJob(raw)) return null;
  if (!isPowerPlatformJob(raw)) return null;
  if (!isIndiaLocation(raw.location)) return null;
  if (containsNegativeKeywords(raw)) return null;

  const cleanUrl = normalizeUrl(raw.url);
  const id = explicitId || generateJobId(cleanUrl);
  const tags = extractSkillTags(raw.title, raw.description);

  return {
    id,
    title: raw.title.trim(),
    company: raw.company.trim(),
    location: raw.location.trim(),
    url: cleanUrl,
    tags,
    source,
    description: raw.description?.trim() || '',
    publishedAt: raw.publishedAt
  };
}

export function parseRemotiveJob(raw: any): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const rawListing: RawJobListing = {
    title: raw.title || '',
    company: raw.company_name || '',
    location: raw.candidate_required_location || 'Worldwide',
    description: raw.description || '',
    url: raw.url || '',
    publishedAt: raw.publication_date
  };
  return processCandidateJob(rawListing, 'remotive', raw.id ? `remotive-${raw.id}` : undefined);
}

export function parseJobicyJob(raw: any): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const rawListing: RawJobListing = {
    title: raw.jobTitle || '',
    company: raw.companyName || '',
    location: raw.jobGeo || 'Remote',
    description: raw.jobDescription || '',
    url: raw.url || '',
    publishedAt: raw.pubDate
  };
  return processCandidateJob(rawListing, 'jobicy', raw.id ? `jobicy-${raw.id}` : undefined);
}

export function parseArbeitnowJob(raw: any): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const location = raw.remote ? `${raw.location || 'Remote'} (Remote)` : raw.location || 'Remote';
  const rawListing: RawJobListing = {
    title: raw.title || '',
    company: raw.company_name || '',
    location,
    description: raw.description || '',
    url: raw.url || ''
  };
  return processCandidateJob(rawListing, 'arbeitnow', raw.slug ? `arbeitnow-${raw.slug}` : undefined);
}

export function parseRssItem(raw: any, sourceName: string): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const title = raw.title || '';
  const description = raw.description || '';
  const link = raw.link || '';

  // Often RSS title is "Company: Job Title"
  let company = 'Tech Company';
  let cleanTitle = title;
  if (title.includes(':')) {
    const parts = title.split(':');
    company = parts[0].trim();
    cleanTitle = parts.slice(1).join(':').trim();
  }

  const rawListing: RawJobListing = {
    title: cleanTitle || title,
    company,
    location: 'Remote Worldwide',
    description,
    url: link,
    publishedAt: raw.pubDate
  };

  return processCandidateJob(rawListing, sourceName);
}

async function fetchWithTimeout(url: string, timeoutMs: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, application/xml, text/xml, */*'
      },
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchPowerPlatformJobs(): Promise<Job[]> {
  const jobs: Job[] = [];
  const seenUrls = new Set<string>();

  const addUnique = (candidate: Job | null) => {
    if (!candidate) return;
    if (seenUrls.has(candidate.url)) return;
    seenUrls.add(candidate.url);
    jobs.push(candidate);
  };

  // List of scrapers to execute concurrently
  const tasks: Array<() => Promise<void>> = [
    // 1. Remotive Queries
    async () => {
      const queries = ['power apps', 'power platform', 'dynamics'];
      for (const q of queries) {
        try {
          const res = await fetchWithTimeout(
            `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}`
          );
          if (res.ok) {
            const data: any = await res.json();
            if (Array.isArray(data.jobs)) {
              for (const item of data.jobs) {
                addUnique(parseRemotiveJob(item));
              }
            }
          }
        } catch (err: any) {
          console.warn(`[Scraper] Remotive search failed for "${q}":`, err.message);
        }
      }
    },

    // 2. Jobicy API
    async () => {
      try {
        const res = await fetchWithTimeout(
          'https://jobicy.com/api/v2/remote-jobs?count=50&tag=power%20platform'
        );
        if (res.ok) {
          const data: any = await res.json();
          if (Array.isArray(data.jobs)) {
            for (const item of data.jobs) {
              addUnique(parseJobicyJob(item));
            }
          }
        }
      } catch (err: any) {
        console.warn('[Scraper] Jobicy API failed:', err.message);
      }
    },

    // 3. Arbeitnow API
    async () => {
      try {
        const res = await fetchWithTimeout('https://www.arbeitnow.com/api/job-board-api');
        if (res.ok) {
          const data: any = await res.json();
          if (Array.isArray(data.data)) {
            for (const item of data.data) {
              addUnique(parseArbeitnowJob(item));
            }
          }
        }
      } catch (err: any) {
        console.warn('[Scraper] Arbeitnow API failed:', err.message);
      }
    },

    // 4. Public RSS Feed (We Work Remotely)
    async () => {
      try {
        const res = await fetchWithTimeout(
          'https://weworkremotely.com/categories/remote-programming-jobs.rss'
        );
        if (res.ok) {
          const xmlText = await res.text();
          const parser = new XMLParser({ processEntities: false });
          const parsed = parser.parse(xmlText);
          const items = parsed?.rss?.channel?.item;
          if (Array.isArray(items)) {
            for (const item of items) {
              addUnique(parseRssItem(item, 'weworkremotely'));
            }
          } else if (items) {
            addUnique(parseRssItem(items, 'weworkremotely'));
          }
        }
      } catch (err: any) {
        console.warn('[Scraper] WeWorkRemotely RSS failed:', err.message);
      }
    }
  ];

  // Run all feed tasks concurrently with error isolation (NF-002)
  await Promise.allSettled(tasks.map((task) => task()));

  console.log(`[Scraper] Total matching Power Platform jobs collected: ${jobs.length}`);
  return jobs;
}
