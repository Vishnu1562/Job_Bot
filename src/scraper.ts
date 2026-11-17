// Backward-compatible barrel re-export.
// Prefer importing directly from './scrapers/index.ts' or specific scrapers.
export {
  fetchJobsForProfile,
  fetchPowerPlatformJobs,
  parseRemotiveJob,
  parseJobicyJob,
  parseArbeitnowJob,
  parseRemoteOkJob,
  parseRssItem,
  parseJSearchJob,
  parseAdzunaJob,
  fetchJSearchJobs,
  fetchAdzunaJobs,
  generateJobId,
  processCandidateJob,
  fetchWithTimeout,
  USER_AGENT
} from './scrapers/index.ts';
