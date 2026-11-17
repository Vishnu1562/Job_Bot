import type { RawJobListing } from '../types.ts';

export const POWER_PLATFORM_KEYWORDS = [
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

export function isPowerPlatformJob(job: RawJobListing): boolean {
  const text = `${job.title} ${job.description || ''}`.toLowerCase();
  return POWER_PLATFORM_KEYWORDS.some((kw) => text.includes(kw));
}
