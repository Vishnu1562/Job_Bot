import type { JobProfile } from '../types.ts';
import { isKnownTargetCompany } from '../config/targetCompanies.ts';

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
  if (!company) {
    return false;
  }
  const cleanName = company.trim();

  // 1. Check profile-specific target companies
  if (profile?.targetCompanies && profile.targetCompanies.length > 0) {
    const matched = profile.targetCompanies.some((pattern) => {
      if (typeof pattern === 'string') {
        return cleanName.toLowerCase().includes(pattern.toLowerCase());
      }
      return pattern.test(cleanName);
    });
    if (matched) return true;
  }

  // 2. Check global target companies registry
  return isKnownTargetCompany(cleanName);
}
