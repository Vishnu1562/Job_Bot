import type { JobProfile, RawJobListing } from '../types.ts';

export interface ExperienceRange {
  minYears?: number;
  maxYears?: number;
}

export function extractRequiredExperience(text: string): ExperienceRange | null {
  if (!text) return null;

  // 1. Range: "3-5 years", "3 to 5 years", "3 - 5 yrs"
  const rangeMatch = text.match(/\b([0-9]{1,2})\s*(?:-|to)\s*([0-9]{1,2})\s*(?:years|year|yrs|yr)\b/i);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    if (min <= 30 && max <= 40) {
      return { minYears: min, maxYears: max };
    }
  }

  // 2. Minimum or Plus: "4+ years", "4 + years", "minimum 4 years", "at least 4 years"
  const plusMatch = text.match(/\b([0-9]{1,2})\s*\+\s*(?:years|year|yrs|yr)\b/i);
  if (plusMatch) {
    const min = parseInt(plusMatch[1], 10);
    if (min <= 30) {
      return { minYears: min, maxYears: undefined };
    }
  }

  const minMatch = text.match(/\b(?:min(?:imum)?|at least)\s+([0-9]{1,2})\s*(?:years|year|yrs|yr)\b/i);
  if (minMatch) {
    const min = parseInt(minMatch[1], 10);
    if (min <= 30) {
      return { minYears: min, maxYears: undefined };
    }
  }

  // 3. "X years of experience": "5 years of experience", "5 years of backend experience"
  const generalMatch = text.match(
    /\b([0-9]{1,2})\s*(?:years|year|yrs|yr)\s+(?:of\s+)?(?:[a-zA-Z-]+\s+)?(?:hands-on\s+)?experience\b/i
  );
  if (generalMatch) {
    const min = parseInt(generalMatch[1], 10);
    if (min <= 30) {
      return { minYears: min, maxYears: undefined };
    }
  }

  return null;
}

export function isExperienceMatching(job: RawJobListing, profile: JobProfile): boolean {
  if (!profile.experience) return true;

  const title = (job.title || '').toLowerCase();
  const description = (job.description || '').toLowerCase();
  const combined = `${title} ${description}`;

  // 1. Check excluded seniority titles (e.g. Director, VP, Principal, Intern)
  if (profile.experience.excludedSeniority && profile.experience.excludedSeniority.length > 0) {
    for (const seniority of profile.experience.excludedSeniority) {
      const regex = new RegExp(`\\b${seniority}\\b`, 'i');
      if (regex.test(title)) {
        return false;
      }
    }
  }

  // 2. Extract numerical experience requirements
  const detected = extractRequiredExperience(combined);

  // If no explicit years mentioned, accept if title did not trigger excluded seniority
  if (!detected) {
    return true;
  }

  // 3. Verify against profile bounds
  const { minYears: profMin, maxYears: profMax } = profile.experience;

  // If job requires more minimum years than profile max: reject (overqualified job)
  if (profMax !== undefined && detected.minYears !== undefined && detected.minYears > profMax) {
    return false;
  }

  // If job has an explicit max that is less than profile min (e.g. 0-1 years for a profile with min 2): reject
  if (profMin !== undefined && detected.maxYears !== undefined && detected.maxYears < profMin) {
    return false;
  }

  return true;
}
