/**
 * Centralized registry of all external job board APIs, aggregators, ATS platforms, and RSS feeds.
 */
export const API_ENDPOINTS = {
  /** RapidAPI JSearch v5 Google for Jobs aggregator (LinkedIn, Naukri, Indeed, Glassdoor) */
  JSEARCH: 'https://jsearch.p.rapidapi.com/search-v2',

  /** Adzuna India developer job search API */
  ADZUNA_INDIA: 'https://api.adzuna.com/v1/api/jobs/in/search/1',

  /** Remotive remote jobs API */
  REMOTIVE: 'https://remotive.com/api/remote-jobs',

  /** Jobicy remote jobs API */
  JOBICY: 'https://jobicy.com/api/v2/remote-jobs',

  /** Arbeitnow European & global tech job board API */
  ARBEITNOW: 'https://www.arbeitnow.com/api/job-board-api',

  /** RemoteOK developer job board API */
  REMOTEOK: 'https://remoteok.com/api',

  /** Greenhouse public job board API */
  GREENHOUSE_BOARDS: 'https://boards-api.greenhouse.io/v1/boards',

  /** Lever public postings API */
  LEVER_POSTINGS: 'https://api.lever.co/v0/postings',

  /** SmartRecruiters public postings API */
  SMARTRECRUITERS_POSTINGS: 'https://api.smartrecruiters.com/v1/companies',

  /** SmartRecruiters public job application web URL */
  SMARTRECRUITERS_JOBS: 'https://jobs.smartrecruiters.com'
} as const;

/**
 * Official career portal base URLs for top enterprise and Big 4 consultancies.
 */
export const TARGET_CAREER_PORTALS = {
  DELOITTE: 'https://careers.deloitte.com',
  PWC: 'https://pwc.wd3.myworkdayjobs.com',
  EY: 'https://careers.ey.com',
  KPMG: 'https://kpmg.com/careers',
  IBM: 'https://www.ibm.com/careers',
  UST: 'https://www.ust.com/en/careers',
  IBS_SOFTWARE: 'https://www.ibsplc.com/careers',
  COGNIZANT: 'https://careers.cognizant.com',
  ACCENTURE: 'https://www.accenture.com/in-en/careers',
  CAPGEMINI: 'https://www.capgemini.com/in-en/careers',
  INFOSYS: 'https://www.infosys.com/careers',
  TCS: 'https://www.tcs.com/careers',
  WIPRO: 'https://careers.wipro.com'
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
