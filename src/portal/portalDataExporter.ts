import type { Job, JobProfile } from '../types.ts';
import { JobDatabase } from '../db/jobDatabase.ts';
import { isTargetCompany } from '../filters/companyFilter.ts';

export interface PortalJobItem {
  id: string;
  profileId: string;
  title: string;
  company: string;
  location: string;
  url: string;
  tags: string[];
  source: string;
  description: string;
  scrapedAt: string;
  dateGroup: string; // e.g. "2026-11-17"
  dateLabel: string; // e.g. "Today's Batch", "Yesterday", "Nov 15, 2026"
  tier: 'domestic' | 'remote';
  isTargetCompany?: boolean;
}

export interface PortalProfileData {
  id: string;
  name: string;
  accentColor: string;
  candidateName?: string;
  jobsCount: number;
}

export interface PortalData {
  generatedAt: string;
  totalJobsCount: number;
  profiles: PortalProfileData[];
  jobsByProfile: Record<string, PortalJobItem[]>;
  allJobs: PortalJobItem[];
}

export function isDomesticJob(job: Job): boolean {
  const src = (job.source || '').toLowerCase();
  return (
    src.includes('jsearch') ||
    src.includes('adzuna') ||
    src.includes('linkedin') ||
    src.includes('naukri') ||
    src.includes('indeed')
  );
}

function formatDateLabel(isoString: string): { dateGroup: string; dateLabel: string } {
  try {
    const jobDate = new Date(isoString);
    if (isNaN(jobDate.getTime())) {
      return { dateGroup: 'unknown', dateLabel: 'Archive' };
    }

    const now = new Date();
    const dateGroup = jobDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const nowDateStr = now.toISOString().slice(0, 10);

    const diffMs = now.getTime() - jobDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (dateGroup === nowDateStr || diffHours <= 24) {
      return { dateGroup, dateLabel: "Today's Batch" };
    }

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (dateGroup === yesterday.toISOString().slice(0, 10)) {
      return { dateGroup, dateLabel: 'Yesterday' };
    }

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return { dateGroup, dateLabel: jobDate.toLocaleDateString('en-US', options) };
  } catch {
    return { dateGroup: 'unknown', dateLabel: 'Archive' };
  }
}

export function exportPortalData(db: JobDatabase, profiles: JobProfile[]): PortalData {
  const profileMap = new Map<string, JobProfile>();
  profiles.forEach((p) => profileMap.set(p.id, p));

  const jobsByProfile: Record<string, PortalJobItem[]> = {};
  const allJobs: PortalJobItem[] = [];

  for (const profile of profiles) {
    jobsByProfile[profile.id] = [];
    const dbJobs = db.getAllActiveJobs(60, profile.id);

    for (const j of dbJobs) {
      const isTarget = isTargetCompany(j.company, profile);
      const tier: 'domestic' | 'remote' = isDomesticJob(j) ? 'domestic' : 'remote';
      const { dateGroup, dateLabel } = formatDateLabel(j.scrapedAt || new Date().toISOString());

      const item: PortalJobItem = {
        id: j.id || j.url,
        profileId: profile.id,
        title: j.title,
        company: j.company || 'Confidential Company',
        location: j.location || 'India / Remote',
        url: j.url,
        tags: j.tags || [],
        source: j.source || 'job feed',
        description: (j.description || '').slice(0, 250),
        scrapedAt: j.scrapedAt || new Date().toISOString(),
        dateGroup,
        dateLabel,
        tier,
        isTargetCompany: isTarget
      };

      jobsByProfile[profile.id].push(item);
      allJobs.push(item);
    }
  }

  // Chronological sort: newest scrapedAt first
  const sortFn = (a: PortalJobItem, b: PortalJobItem) => {
    const tA = new Date(a.scrapedAt).getTime() || 0;
    const tB = new Date(b.scrapedAt).getTime() || 0;
    return tB - tA;
  };

  allJobs.sort(sortFn);
  for (const pid of Object.keys(jobsByProfile)) {
    jobsByProfile[pid].sort(sortFn);
  }

  const profileSummaries: PortalProfileData[] = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    accentColor: p.accentColor,
    candidateName: p.candidateName,
    jobsCount: (jobsByProfile[p.id] || []).length
  }));

  return {
    generatedAt: new Date().toISOString(),
    totalJobsCount: allJobs.length,
    profiles: profileSummaries,
    jobsByProfile,
    allJobs
  };
}
