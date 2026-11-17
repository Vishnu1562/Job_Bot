import { getProfiles } from '../profiles/index.ts';
import { fetchJSearchJobs, fetchAdzunaJobs } from './jsearch.ts';
import { fetchRemoteBoardJobs } from './remoteBoards.ts';
import type { Job, JobProfile } from '../types.ts';

export {
  parseRemotiveJob,
  parseJobicyJob,
  parseArbeitnowJob,
  parseRemoteOkJob,
  parseRssItem
} from './remoteBoards.ts';

export {
  parseJSearchJob,
  parseAdzunaJob,
  fetchJSearchJobs,
  fetchAdzunaJobs
} from './jsearch.ts';

export {
  generateJobId,
  processCandidateJob,
  fetchWithTimeout,
  USER_AGENT
} from './common.ts';

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
    fetchAdzunaJobs(profile, addUnique)
  ]);

  console.log(`[Scraper][${profile.name}] Total matching jobs collected: ${jobs.length}`);
  return jobs;
}

export async function fetchPowerPlatformJobs(): Promise<Job[]> {
  const defaultProfile = getProfiles()[0];
  return fetchJobsForProfile(defaultProfile);
}
