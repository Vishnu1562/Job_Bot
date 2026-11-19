import { getProfiles } from '../profiles/profileRegistry.ts';
import { fetchJSearchJobs, fetchAdzunaJobs } from './jsearchScraper.ts';
import { fetchRemoteBoardJobs } from './remoteBoardsScraper.ts';
import { fetchDirectAtsJobs } from './atsScraper.ts';
import type { Job, JobProfile } from '../types.ts';

export {
  parseRemotiveJob,
  parseJobicyJob,
  parseArbeitnowJob,
  parseRemoteOkJob,
  parseRssItem
} from './remoteBoardsScraper.ts';

export {
  parseJSearchJob,
  parseAdzunaJob,
  fetchJSearchJobs,
  fetchAdzunaJobs
} from './jsearchScraper.ts';

export {
  parseGreenhouseJob,
  parseLeverJob,
  parseSmartRecruitersJob,
  fetchDirectAtsJobs
} from './atsScraper.ts';

export {
  generateJobId,
  processCandidateJob,
  fetchWithTimeout,
  USER_AGENT
} from './scraperUtils.ts';

export async function fetchJobsForProfile(profile: JobProfile): Promise<Job[]> {
  const jobs: Job[] = [];
  const seenUrls = new Set<string>();

  const addUnique = (candidate: Job | null) => {
    if (!candidate) return;
    if (seenUrls.has(candidate.url)) return;
    seenUrls.add(candidate.url);
    jobs.push(candidate);
  };

  await Promise.allSettled([
    fetchRemoteBoardJobs(profile, addUnique),
    fetchJSearchJobs(profile, addUnique),
    fetchAdzunaJobs(profile, addUnique),
    fetchDirectAtsJobs(profile, addUnique)
  ]);

  console.log(`[Scraper][${profile.name}] Total matching jobs collected: ${jobs.length}`);
  return jobs;
}

export async function fetchPowerPlatformJobs(): Promise<Job[]> {
  const defaultProfile = getProfiles()[0];
  return fetchJobsForProfile(defaultProfile);
}
