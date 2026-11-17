import { XMLParser } from 'fast-xml-parser';
import { processCandidateJob, fetchWithTimeout } from './scraperUtils.ts';
import type { Job, RawJobListing, JobProfile } from '../types.ts';

export function parseRemotiveJob(raw: any, profile?: JobProfile): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const rawListing: RawJobListing = {
    title: raw.title || '',
    company: raw.company_name || '',
    location: raw.candidate_required_location || 'Worldwide',
    description: raw.description || '',
    url: raw.url || '',
    publishedAt: raw.publication_date
  };
  return processCandidateJob(
    rawListing,
    'remotive',
    raw.id ? `remotive-${raw.id}` : undefined,
    profile
  );
}

export function parseJobicyJob(raw: any, profile?: JobProfile): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const rawListing: RawJobListing = {
    title: raw.jobTitle || '',
    company: raw.companyName || '',
    location: raw.jobGeo || 'Remote',
    description: raw.jobDescription || '',
    url: raw.url || '',
    publishedAt: raw.pubDate
  };
  return processCandidateJob(
    rawListing,
    'jobicy',
    raw.id ? `jobicy-${raw.id}` : undefined,
    profile
  );
}

export function parseArbeitnowJob(raw: any, profile?: JobProfile): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const location = raw.remote ? `${raw.location || 'Remote'} (Remote)` : raw.location || 'Remote';
  const rawListing: RawJobListing = {
    title: raw.title || '',
    company: raw.company_name || '',
    location,
    description: raw.description || '',
    url: raw.url || ''
  };
  return processCandidateJob(
    rawListing,
    'arbeitnow',
    raw.slug ? `arbeitnow-${raw.slug}` : undefined,
    profile
  );
}

export function parseRemoteOkJob(raw: any, profile?: JobProfile): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const position = raw.position || raw.title;
  if (!position) return null;

  const rawListing: RawJobListing = {
    title: position,
    company: raw.company || '',
    location: raw.location || 'Worldwide Remote',
    description: raw.description || '',
    url: raw.apply_url || raw.url || '',
    publishedAt: raw.date
  };

  return processCandidateJob(
    rawListing,
    'remoteok',
    raw.id ? `remoteok-${raw.id}` : undefined,
    profile
  );
}

export function parseRssItem(raw: any, sourceName: string, profile?: JobProfile): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const title = raw.title || '';
  const description = raw.description || '';
  const link = raw.link || '';

  let company = 'Tech Company';
  let cleanTitle = title;
  if (title.includes(' at ')) {
    const parts = title.split(' at ');
    cleanTitle = parts[0].trim();
    company = parts[1].trim();
  } else if (title.includes(':')) {
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

  return processCandidateJob(rawListing, sourceName, undefined, profile);
}

export async function fetchRemoteBoardJobs(
  profile: JobProfile,
  addUnique: (candidate: Job | null) => void
): Promise<void> {
  const tasks: Array<() => Promise<void>> = [
    // 1. Remotive Queries
    async () => {
      for (const q of profile.queryTerms) {
        try {
          const res = await fetchWithTimeout(
            `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}`
          );
          if (res.ok) {
            const data: any = await res.json();
            if (Array.isArray(data.jobs)) {
              for (const item of data.jobs) {
                addUnique(parseRemotiveJob(item, profile));
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
      for (const q of profile.queryTerms.slice(0, 3)) {
        try {
          const res = await fetchWithTimeout(
            `https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(q)}`
          );
          if (res.ok) {
            const data: any = await res.json();
            if (Array.isArray(data.jobs)) {
              for (const item of data.jobs) {
                addUnique(parseJobicyJob(item, profile));
              }
            }
          }
        } catch (err: any) {
          console.warn(`[Scraper] Jobicy API failed for "${q}":`, err.message);
        }
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
              addUnique(parseArbeitnowJob(item, profile));
            }
          }
        }
      } catch (err: any) {
        console.warn('[Scraper] Arbeitnow API failed:', err.message);
      }
    },

    // 4. RemoteOK API
    async () => {
      try {
        const res = await fetchWithTimeout('https://remoteok.com/api');
        if (res.ok) {
          const data: any = await res.json();
          if (Array.isArray(data)) {
            for (const item of data) {
              addUnique(parseRemoteOkJob(item, profile));
            }
          }
        }
      } catch (err: any) {
        console.warn('[Scraper] RemoteOK API failed:', err.message);
      }
    },

    // 5. Public RSS Feeds (WeWorkRemotely, Himalayas, NoDesk)
    async () => {
      const feeds = [
        { url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss', source: 'weworkremotely' },
        { url: 'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss', source: 'weworkremotely' },
        { url: 'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss', source: 'weworkremotely' },
        { url: 'https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss', source: 'weworkremotely' },
        { url: 'https://himalayas.app/jobs/rss', source: 'himalayas' },
        { url: 'https://nodesk.co/remote-jobs/index.xml', source: 'nodesk' }
      ];

      for (const feed of feeds) {
        try {
          const res = await fetchWithTimeout(feed.url);
          if (res.ok) {
            const xmlText = await res.text();
            const parser = new XMLParser({ processEntities: false });
            const parsed = parser.parse(xmlText);
            const items = parsed?.rss?.channel?.item;
            if (Array.isArray(items)) {
              for (const item of items) {
                addUnique(parseRssItem(item, feed.source, profile));
              }
            } else if (items) {
              addUnique(parseRssItem(items, feed.source, profile));
            }
          }
        } catch (err: any) {
          console.warn(`[Scraper] RSS feed failed for ${feed.source}:`, err.message);
        }
      }
    }
  ];

  await Promise.allSettled(tasks.map((task) => task()));
}
