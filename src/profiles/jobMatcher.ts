import type { JobProfile, RawJobListing } from '../types.ts';

export function isJobMatchingProfile(job: RawJobListing, profile: JobProfile): boolean {
  const titleLower = (job.title || '').toLowerCase();

  // Enforce Title Relevance: Drop jobs with conflicting tech stack titles (e.g. Magento, PHP, WordPress)
  if (profile.excludedTitleKeywords && profile.excludedTitleKeywords.length > 0) {
    const isExcluded = profile.excludedTitleKeywords.some((pattern) => {
      if (typeof pattern === 'string') {
        return titleLower.includes(pattern.toLowerCase());
      }
      return pattern.test(titleLower);
    });
    if (isExcluded) return false;
  }

  const combined = `${job.title} ${job.description || ''}`.toLowerCase();

  // For Full Stack, ensure role matches developer keywords AND at least one of target tech stack
  if (profile.id === 'full-stack') {
    const isTechRole =
      combined.includes('developer') ||
      combined.includes('engineer') ||
      combined.includes('architect') ||
      combined.includes('programmer') ||
      combined.includes('full stack') ||
      combined.includes('fullstack');

    if (!isTechRole) return false;

    const targetStack = [
      'angular',
      'nestjs',
      'nest.js',
      '.net',
      'dotnet',
      'c#',
      'postgres',
      'postgresql',
      'mssql',
      'azure devops',
      'github'
    ];
    return targetStack.some((tech) => combined.includes(tech));
  }

  // For Java Backend, ensure developer role AND matches Java / Spring Boot / Hibernate
  if (profile.id === 'java-backend') {
    const isTechRole =
      combined.includes('developer') ||
      combined.includes('engineer') ||
      combined.includes('architect') ||
      combined.includes('programmer') ||
      combined.includes('backend') ||
      combined.includes('software');

    if (!isTechRole) return false;

    const hasJavaCore =
      /(?:^|[^a-zA-Z0-9])java(?:$|[^a-zA-Z0-9])/i.test(combined) ||
      combined.includes('spring') ||
      combined.includes('spring boot') ||
      combined.includes('springboot') ||
      combined.includes('hibernate');

    return hasJavaCore;
  }

  // Standard matching for other profiles
  return profile.keywords.some((kw) => {
    if (typeof kw === 'string') {
      return combined.includes(kw.toLowerCase());
    }
    return kw.test(combined);
  });
}

export function extractProfileSkillTags(
  title: string,
  description: string = '',
  profile: JobProfile
): string[] {
  const combined = `${title} ${description}`;
  const foundTags: string[] = [];

  for (const rule of profile.skills) {
    const matches = rule.patterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return combined.toLowerCase().includes(pattern.toLowerCase());
      }
      return pattern.test(combined);
    });

    if (matches && !foundTags.includes(rule.tag)) {
      foundTags.push(rule.tag);
    }
  }

  if (foundTags.length === 0) {
    foundTags.push(profile.defaultTag);
  }

  return foundTags;
}
