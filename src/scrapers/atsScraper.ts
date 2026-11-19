import { fetchWithTimeout, processCandidateJob } from './scraperUtils.ts';
import { TARGET_COMPANIES, type TargetCompany } from '../config/targetCompanies.ts';
import { API_ENDPOINTS } from '../constants/apiEndpoints.ts';
import type { Job, JobProfile, RawJobListing } from '../types.ts';

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Checks if a location string or object represents an Indian city, India country code, or remote.
 */
export function isEligibleCandidateLocation(locationText: string): boolean {
  if (!locationText) return false;
  const lower = locationText.toLowerCase();

  const indianMarkers = [
    'india',
    'in',
    'bengaluru',
    'bangalore',
    'hyderabad',
    'pune',
    'mumbai',
    'delhi',
    'noida',
    'gurgaon',
    'gurugram',
    'chennai',
    'kochi',
    'cochin',
    'kerala',
    'karnataka',
    'telangana',
    'tamil nadu',
    'maharashtra',
    'remote',
    'anywhere',
    'worldwide'
  ];

  return indianMarkers.some((marker) => lower.includes(marker));
}

/**
 * Normalizes a raw job item from Greenhouse public board API.
 */
export function parseGreenhouseJob(
  raw: any,
  companyName: string,
  profile?: JobProfile
): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const title = (raw.title || '').trim();
  if (!title) return null;

  const location = (raw.location?.name || 'India').trim();
  if (!isEligibleCandidateLocation(location)) return null;

  const url = (raw.absolute_url || '').trim();
  if (!url) return null;

  const rawListing: RawJobListing = {
    title,
    company: companyName,
    location,
    description: stripHtml(raw.content || ''),
    url,
    publishedAt: raw.updated_at
  };

  const id = `gh-${companyName.toLowerCase()}-${raw.id}`;
  return processCandidateJob(rawListing, `${companyName.toLowerCase()} careers`, id, profile);
}

/**
 * Normalizes a raw job item from Lever public board API.
 */
export function parseLeverJob(
  raw: any,
  companyName: string,
  profile?: JobProfile
): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const title = (raw.text || '').trim();
  if (!title) return null;

  const location = (raw.categories?.location || 'India').trim();
  if (!isEligibleCandidateLocation(location)) return null;

  const url = (raw.hostedUrl || raw.applyUrl || '').trim();
  if (!url) return null;

  const description = stripHtml(raw.descriptionPlain || raw.description || '');

  const rawListing: RawJobListing = {
    title,
    company: companyName,
    location,
    description,
    url,
    publishedAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : undefined
  };

  const id = `lever-${companyName.toLowerCase()}-${raw.id}`;
  return processCandidateJob(rawListing, `${companyName.toLowerCase()} careers`, id, profile);
}

/**
 * Normalizes a raw job item from SmartRecruiters public postings API.
 */
export function parseSmartRecruitersJob(
  raw: any,
  companyName: string,
  profile?: JobProfile
): Job | null {
  if (!raw || typeof raw !== 'object') return null;
  const title = (raw.name || '').trim();
  if (!title) return null;

  const loc = raw.location || {};
  const locationParts = [loc.city, loc.region, loc.country].filter(Boolean);
  let location = locationParts.length > 0 ? locationParts.join(', ') : 'India';
  if (loc.remote) {
    location = `${location} (Remote)`;
  }
  if (!isEligibleCandidateLocation(location)) return null;

  const companySlug = companyName.replace(/\s+/g, '');
  const url = `${API_ENDPOINTS.SMARTRECRUITERS_JOBS}/${companySlug}/${raw.id}`;
  const desc = raw.jobAd?.sections?.jobDescription?.text || title;

  const rawListing: RawJobListing = {
    title,
    company: companyName,
    location,
    description: stripHtml(desc),
    url,
    publishedAt: raw.releasedDate
  };

  const id = `sr-${companyName.toLowerCase()}-${raw.id}`;
  return processCandidateJob(rawListing, `${companyName.toLowerCase()} careers`, id, profile);
}

/**
 * Fetches direct jobs from Greenhouse, Lever, and SmartRecruiters public boards
 * for all configured target companies.
 */
export async function fetchDirectAtsJobs(
  profile: JobProfile,
  addUnique: (candidate: Job | null) => void
): Promise<void> {
  console.log(`[Scraper][ATS] Scanning direct official company career portals for "${profile.name}"...`);
  let addedCount = 0;

  const atsTasks = TARGET_COMPANIES.map(async (company) => {
    try {
      if (company.ats === 'greenhouse') {
        const ghUrl = `${API_ENDPOINTS.GREENHOUSE_BOARDS}/${company.slug}/jobs?content=true`;
        const res = await fetchWithTimeout(ghUrl, 4000);
        if (res.ok) {
          const data = (await res.json()) as any;
          const jobs: any[] = Array.isArray(data?.jobs) ? data.jobs : [];
          for (const item of jobs) {
            const parsed = parseGreenhouseJob(item, company.name, profile);
            if (parsed) {
              addUnique(parsed);
              addedCount++;
            }
          }
        }
      } else if (company.ats === 'lever') {
        const leverUrl = `${API_ENDPOINTS.LEVER_POSTINGS}/${company.slug}?mode=json`;
        const res = await fetchWithTimeout(leverUrl, 4000);
        if (res.ok) {
          const jobs = (await res.json()) as any[];
          if (Array.isArray(jobs)) {
            for (const item of jobs) {
              const parsed = parseLeverJob(item, company.name, profile);
              if (parsed) {
                addUnique(parsed);
                addedCount++;
              }
            }
          }
        }
      } else if (company.ats === 'smartrecruiters') {
        const srUrl = `${API_ENDPOINTS.SMARTRECRUITERS_POSTINGS}/${company.slug}/postings?limit=25`;
        const res = await fetchWithTimeout(srUrl, 4000);
        if (res.ok) {
          const data = (await res.json()) as any;
          const jobs: any[] = Array.isArray(data?.content) ? data.content : [];
          for (const item of jobs) {
            const parsed = parseSmartRecruitersJob(item, company.name, profile);
            if (parsed) {
              addUnique(parsed);
              addedCount++;
            }
          }
        }
      }
    } catch {
      // Individual company failures are caught silently to preserve pipeline continuity
    }
  });

  await Promise.allSettled(atsTasks);

  if (addedCount > 0) {
    console.log(`[Scraper][ATS] Added ${addedCount} direct official company job(s) for "${profile.name}".`);
  }
}
