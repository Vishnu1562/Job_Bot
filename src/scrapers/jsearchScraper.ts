import { processCandidateJob, fetchWithTimeout } from './scraperUtils.ts';
import { API_ENDPOINTS } from '../constants/apiEndpoints.ts';
import type { Job, RawJobListing, JobProfile } from '../types.ts';

export function parseJSearchJob(raw: any, profile?: JobProfile): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const title = raw.job_title || '';
  if (!title) return null;

  const city = raw.job_city || '';
  const state = raw.job_state || '';
  const rawCountry = (raw.job_country || '').toUpperCase();
  const country = rawCountry === 'IN' || rawCountry === 'INDIA' || !rawCountry ? 'India' : raw.job_country;
  const locationParts = [city, state, country].filter(Boolean);
  let location = locationParts.length > 0 ? locationParts.join(', ') : 'India';
  if (raw.job_is_remote) {
    location = `${location} (Remote)`;
  }

  const url = raw.job_apply_link || raw.job_google_link || '';
  if (!url) return null;

  const publisher = raw.job_publisher ? raw.job_publisher.toLowerCase() : 'linkedin';

  const rawListing: RawJobListing = {
    title,
    company: raw.employer_name || 'Tech Company',
    location,
    description: raw.job_description || '',
    url,
    publishedAt: raw.job_posted_at_datetime_utc
  };

  return processCandidateJob(
    rawListing,
    publisher,
    raw.job_id ? `jsearch-${raw.job_id}` : undefined,
    profile
  );
}

export function parseAdzunaJob(raw: any, profile?: JobProfile): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const title = raw.title || '';
  if (!title) return null;

  const location = raw.location?.display_name || 'India';
  const company = raw.company?.display_name || 'Tech Company';
  const url = raw.redirect_url || '';

  const rawListing: RawJobListing = {
    title,
    company,
    location,
    description: raw.description || '',
    url,
    publishedAt: raw.created
  };

  return processCandidateJob(
    rawListing,
    'adzuna',
    raw.id ? `adzuna-${raw.id}` : undefined,
    profile
  );
}

export async function fetchJSearchJobs(
  profile: JobProfile,
  addUnique: (candidate: Job | null) => void
): Promise<void> {
  const rapidApiKey = process.env.RAPIDAPI_KEY?.trim();
  if (!rapidApiKey) {
    console.log(`[Scraper][JSearch] No RAPIDAPI_KEY configured; skipping JSearch live job query.`);
    return;
  }

  console.log(
    `[Scraper][JSearch] RAPIDAPI_KEY detected (${rapidApiKey.slice(0, 5)}...). Querying live LinkedIn/Naukri/Indeed jobs...`
  );
  for (const q of profile.queryTerms.slice(0, 2)) {
    try {
      const searchQuery = `${q} in India`;
      const jsearchUrl = `${API_ENDPOINTS.JSEARCH}?query=${encodeURIComponent(
        searchQuery
      )}&page=1&num_pages=1&date_posted=all`;
      console.log(`[Scraper][JSearch] Requesting: "${searchQuery}"`);
      const res = await fetchWithTimeout(jsearchUrl, 12000, {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.warn(`[Scraper][JSearch] HTTP ${res.status} (${res.statusText}) for "${searchQuery}": ${errText}`);
        continue;
      }
      const data: any = await res.json();
      const items = Array.isArray(data?.data) ? data.data : [];
      console.log(`[Scraper][JSearch] JSearch returned ${items.length} raw items for "${searchQuery}".`);
      let addedCount = 0;
      for (const item of items) {
        const parsed = parseJSearchJob(item, profile);
        if (parsed) {
          addUnique(parsed);
          addedCount++;
        }
      }
      console.log(`[Scraper][JSearch] Filtered & added ${addedCount} matching role(s) for "${profile.name}".`);
    } catch (err: any) {
      console.warn(`[Scraper] JSearch query failed for "${q}":`, err.message);
    }
  }
}

export async function fetchAdzunaJobs(
  profile: JobProfile,
  addUnique: (candidate: Job | null) => void
): Promise<void> {
  const appId = process.env.ADZUNA_APP_ID?.trim();
  const appKey = process.env.ADZUNA_APP_KEY?.trim();
  if (!appId || !appKey) return;

  for (const q of profile.queryTerms.slice(0, 2)) {
    try {
      const adzunaUrl = `${API_ENDPOINTS.ADZUNA_INDIA}?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(
        q
      )}&where=India&content-type=application/json`;
      const res = await fetchWithTimeout(adzunaUrl, 10000);
      if (res.ok) {
        const data: any = await res.json();
        if (Array.isArray(data?.results)) {
          for (const item of data.results) {
            addUnique(parseAdzunaJob(item, profile));
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Scraper] Adzuna India query failed for "${q}":`, err.message);
    }
  }
}
