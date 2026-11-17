/**
 * Centralized registry of all external job board APIs, aggregators, and RSS feeds.
 */

/**
 * Candidate JSearch RapidAPI endpoints probed in sequence to self-heal across version routing shifts.
 */
export const JSEARCH_CANDIDATE_ENDPOINTS = [
  'https://jsearch.p.rapidapi.com/job-search',
  'https://jsearch.p.rapidapi.com/search',
  'https://jsearch.p.rapidapi.com/jobs',
  'https://jsearch.p.rapidapi.com/v1/search'
] as const;

export const API_ENDPOINTS = {
  /** RapidAPI Google for Jobs aggregator (LinkedIn, Naukri, Indeed, Glassdoor) */
  JSEARCH: 'https://jsearch.p.rapidapi.com/job-search',
  JSEARCH_LEGACY: 'https://jsearch.p.rapidapi.com/search',

  /** Adzuna India developer job search API */
  ADZUNA_INDIA: 'https://api.adzuna.com/v1/api/jobs/in/search/1',

  /** Remotive remote jobs API */
  REMOTIVE: 'https://remotive.com/api/remote-jobs',

  /** Jobicy remote jobs API */
  JOBICY: 'https://jobicy.com/api/v2/remote-jobs',

  /** Arbeitnow European & global tech job board API */
  ARBEITNOW: 'https://www.arbeitnow.com/api/job-board-api',

  /** RemoteOK developer job board API */
  REMOTEOK: 'https://remoteok.com/api'
} as const;

export interface RssFeedConfig {
  url: string;
  source: string;
}

/**
 * Public developer RSS feeds monitored daily.
 */
export const RSS_FEEDS: readonly RssFeedConfig[] = [
  { url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss', source: 'weworkremotely' },
  { url: 'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss', source: 'weworkremotely' },
  { url: 'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss', source: 'weworkremotely' },
  { url: 'https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss', source: 'weworkremotely' },
  { url: 'https://himalayas.app/jobs/rss', source: 'himalayas' },
  { url: 'https://nodesk.co/remote-jobs/index.xml', source: 'nodesk' }
] as const;
