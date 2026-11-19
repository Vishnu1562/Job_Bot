import type { JobProfile } from '../types.ts';
import { getPowerPlatformProfile } from './powerPlatformProfile.ts';
import { getFullStackProfile } from './fullStackProfile.ts';
import { getJavaBackendProfile } from './javaBackendProfile.ts';
import { getPlsqlProfile } from './plsqlProfile.ts';

export { DEFAULT_TARGET_COMPANIES } from './targetCompanies.ts';
export { getPowerPlatformProfile } from './powerPlatformProfile.ts';
export { getFullStackProfile } from './fullStackProfile.ts';
export { getJavaBackendProfile } from './javaBackendProfile.ts';
export { getPlsqlProfile } from './plsqlProfile.ts';
export { isJobMatchingProfile, extractProfileSkillTags } from './jobMatcher.ts';
export { resolveProfileRecipients } from './recipientResolver.ts';

export function getProfiles(env: Record<string, string | undefined> = process.env): JobProfile[] {
  return [
    getPowerPlatformProfile(env),
    getFullStackProfile(env),
    getJavaBackendProfile(env),
    getPlsqlProfile(env)
  ];
}
