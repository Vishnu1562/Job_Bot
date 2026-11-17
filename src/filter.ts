// Backward-compatible barrel re-export.
// Prefer importing directly from './filters/index.ts' or specific filter modules.
export {
  validateJob,
  isPowerPlatformJob,
  isIndiaLocation,
  containsNegativeKeywords,
  normalizeUrl,
  isCompanyExcluded,
  isTargetCompany
} from './filters/index.ts';
