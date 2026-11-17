import type { JobProfile } from '../types.ts';
import { DEFAULT_TARGET_COMPANIES } from './targetCompanies.ts';
import { getPowerPlatformProfile } from './powerPlatform.ts';
import { getFullStackProfile } from './fullStack.ts';
import { getJavaBackendProfile } from './javaBackend.ts';

export { DEFAULT_TARGET_COMPANIES } from './targetCompanies.ts';
export { getPowerPlatformProfile } from './powerPlatform.ts';
export { getFullStackProfile } from './fullStack.ts';
export { getJavaBackendProfile } from './javaBackend.ts';
export { isJobMatchingProfile, extractProfileSkillTags } from './matcher.ts';

export function getProfiles(env: Record<string, string | undefined> = process.env): JobProfile[] {
  return [
    getPowerPlatformProfile(env),
    getFullStackProfile(env),
    getJavaBackendProfile(env)
  ];
}
