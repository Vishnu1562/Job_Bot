import type { JobProfile } from '../types.ts';

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
