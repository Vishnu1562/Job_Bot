import type { JobProfile } from '../types.ts';
import { DEFAULT_TARGET_COMPANIES } from './targetCompanies.ts';

export function getFullStackProfile(
  env: Record<string, string | undefined> = process.env
): JobProfile {
  const defaultRecipient = env.RECIPIENT_EMAIL || 'user@example.com';

  return {
    id: 'full-stack',
    name: 'Full Stack Developer Job Radar',
    candidateName: 'Vishnu',
    recipientEmail: env.RECIPIENT_EMAIL_FULLSTACK || defaultRecipient,
    excludedCompanies: [/(?:^|\b)(?:ey|ernst\s*&\s*young|ernst\s*and\s*young)(?:\b|$)/i],
    excludedTitleKeywords: [
      'magento',
      'wordpress',
      'shopify',
      'drupal',
      'php',
      'ruby',
      'rails',
      'salesforce developer',
      'ios developer',
      'android developer',
      'flutter',
      'qa engineer',
      'quality assurance',
      'data engineer'
    ],
    targetCompanies: DEFAULT_TARGET_COMPANIES,
    experience: {
      minYears: 2,
      maxYears: 8,
      excludedSeniority: [
        'director',
        'vp',
        'vice president',
        'head of',
        'intern',
        'internship',
        'fresher'
      ]
    },
    queryTerms: ['full stack', 'angular', 'nestjs', 'dotnet', '.net developer'],
    keywords: [
      'full stack',
      'fullstack',
      'software engineer',
      'backend developer',
      'frontend developer',
      'web developer',
      'angular',
      'nestjs',
      'nest.js',
      '.net',
      'dotnet',
      'postgres',
      'postgresql',
      'mssql',
      'azure devops',
      'github'
    ],
    skills: [
      {
        tag: '[NestJS]',
        patterns: ['nestjs', 'nest.js', /\bnest\s*js\b/i]
      },
      {
        tag: '[Angular]',
        patterns: ['angular', /\bangular\s*[0-9]+\b/i, /\bangularjs\b/i]
      },
      {
        tag: '[.NET]',
        patterns: [
          /(?:^|[^a-zA-Z0-9])\.net(?:$|[^a-zA-Z0-9])/i,
          /\bdotnet\b/i,
          /\bc#\b/i,
          /\basp\.net\b/i,
          /\b\.net\s*core\b/i,
          /\bnet\s*[6-9]\b/i
        ]
      },
      {
        tag: '[PostgreSQL]',
        patterns: ['postgresql', 'postgres', /\bpsql\b/i]
      },
      {
        tag: '[MSSQL]',
        patterns: ['mssql', 'sql server', 'ms sql', 'microsoft sql server', 'microsoft sql']
      },
      {
        tag: '[Azure DevOps]',
        patterns: ['azure devops', 'ado pipelines', 'azure pipeline', 'azure repos']
      },
      {
        tag: '[GitHub]',
        patterns: ['github', 'github actions', 'gh actions']
      }
    ],
    defaultTag: '[Full Stack]',
    accentColor: '#0284c7'
  };
}
