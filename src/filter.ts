import type { RawJobListing, JobProfile } from './types.ts';

const POWER_PLATFORM_KEYWORDS = [
  'power apps',
  'powerapps',
  'power platform',
  'powerplatform',
  'power automate',
  'powerautomate',
  'dataverse',
  'pcf',
  'power pages',
  'powerpages',
  'power virtual agents',
  'copilot studio',
  'dynamics 365'
];

const NEGATIVE_KEYWORDS = [
  'unpaid',
  'unpaid internship',
  'excel only',
  'data entry',
  'typing',
  'transcription',
  'commission only',
  'recruiter spam',
  'survey taker',
  'copy paste'
];

const INDIA_LOCATION_KEYWORDS = [
  'india',
  // Kochi / Kerala / Technopark
  'kochi',
  'cochin',
  'infopark',
  'kerala',
  'trivandrum',
  'thiruvananthapuram',
  'technopark',
  'calicut',
  'kozhikode',
  // Bengaluru / Karnataka
  'bangalore',
  'bengaluru',
  'karnataka',
  'whitefield',
  'electronic city',
  'manyata',
  'bellandur',
  'mysore',
  'mysuru',
  // Hyderabad / Telangana / AP
  'hyderabad',
  'telangana',
  'hitec city',
  'cyberabad',
  'gachibowli',
  'madhapur',
  'kondapur',
  'visakhapatnam',
  'vizag',
  // Pune / Mumbai / Maharashtra
  'pune',
  'maharashtra',
  'hinjawadi',
  'magarpatta',
  'kharadi',
  'mumbai',
  'navi mumbai',
  'airoli',
  'thane',
  // Chennai / Coimbatore / Tamil Nadu
  'chennai',
  'tamil nadu',
  'omr',
  'tidel',
  'tidel park',
  'guindy',
  'siruseri',
  'coimbatore',
  // Delhi NCR
  'delhi',
  'ncr',
  'noida',
  'greater noida',
  'gurgaon',
  'gurugram',
  'faridabad',
  'cyber city',
  // East & West
  'kolkata',
  'west bengal',
  'salt lake',
  'sector v',
  'new town',
  'ahmedabad',
  'gujarat',
  'gift city',
  // Remote & Global
  'remote - in',
  'remote in',
  'remote - india',
  'remote (india)',
  'india (remote)',
  'worldwide',
  'anywhere',
  'global'
];

const EXCLUDED_REGIONS = [
  'us only',
  'usa only',
  'united states only',
  'us / canada only',
  'uk only',
  'united kingdom only',
  'europe only',
  'eu only',
  'latam only',
  'canada only'
];

export function validateJob(job: RawJobListing): boolean {
  if (!job || typeof job !== 'object') return false;
  if (!job.title || typeof job.title !== 'string' || job.title.trim() === '') return false;
  if (!job.url || typeof job.url !== 'string' || !job.url.startsWith('http')) return false;
  return true;
}

export function isPowerPlatformJob(job: RawJobListing): boolean {
  const text = `${job.title} ${job.description || ''}`.toLowerCase();
  return POWER_PLATFORM_KEYWORDS.some((kw) => text.includes(kw));
}

export function isIndiaLocation(locationText: string): boolean {
  if (!locationText) return false;
  const loc = locationText.toLowerCase();

  // Check if explicitly restricted to another country/region
  for (const excluded of EXCLUDED_REGIONS) {
    if (loc.includes(excluded)) {
      return false;
    }
  }

  // Check if matches India or Worldwide/Global
  return INDIA_LOCATION_KEYWORDS.some((kw) => loc.includes(kw));
}

export function containsNegativeKeywords(job: RawJobListing): boolean {
  const text = `${job.title} ${job.description || ''}`.toLowerCase();
  return NEGATIVE_KEYWORDS.some((neg) => text.includes(neg));
}

export function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Strip common tracking and referral query parameters
    const paramsToStrip = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
      'source',
      'tracker',
      'gh_src'
    ];
    paramsToStrip.forEach((param) => parsed.searchParams.delete(param));
    // If no params left, remove the trailing '?'
    const query = parsed.searchParams.toString();
    return `${parsed.origin}${parsed.pathname}${query ? `?${query}` : ''}`;
  } catch {
    return rawUrl.trim();
  }
}

export function isCompanyExcluded(company: string, profile: JobProfile): boolean {
  if (!company || !profile.excludedCompanies || profile.excludedCompanies.length === 0) {
    return false;
  }
  const cleanName = company.trim();
  return profile.excludedCompanies.some((pattern) => {
    if (typeof pattern === 'string') {
      return cleanName.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(cleanName);
  });
}

export function isTargetCompany(company: string, profile: JobProfile): boolean {
  if (!company || !profile.targetCompanies || profile.targetCompanies.length === 0) {
    return false;
  }
  const cleanName = company.trim();
  return profile.targetCompanies.some((pattern) => {
    if (typeof pattern === 'string') {
      return cleanName.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(cleanName);
  });
}
