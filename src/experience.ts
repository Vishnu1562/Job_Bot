// Backward-compatible barrel re-export.
// Prefer importing directly from './filters/index.ts' or './filters/experience.ts'.
export {
  extractRequiredExperience,
  isExperienceMatching,
  type ExperienceRange
} from './filters/index.ts';
