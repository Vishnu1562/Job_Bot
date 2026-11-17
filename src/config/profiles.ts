// Backward-compatible barrel re-export.
// Direct imports should prefer '../profiles/index.ts' or individual subfiles.
export {
  DEFAULT_TARGET_COMPANIES,
  getProfiles,
  getPowerPlatformProfile,
  getFullStackProfile,
  getJavaBackendProfile,
  isJobMatchingProfile,
  extractProfileSkillTags
} from '../profiles/index.ts';
