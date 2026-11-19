import type { JobProfile } from '../types.ts';
import { DEFAULT_TARGET_COMPANIES } from './targetCompanies.ts';
import { resolveProfileRecipients } from './recipientResolver.ts';

export function getPlsqlProfile(
  env: Record<string, string | undefined> = process.env
): JobProfile {
  const defaultRecipient = env.RECIPIENT_EMAIL || '';
  const profileRecipient = env.RECIPIENT_EMAIL_PLSQL || '';

  return {
    id: 'plsql-developer',
    name: 'PL/SQL Developer Job Radar',
    candidateName: 'Minnu',
    recipientEmail: resolveProfileRecipients(defaultRecipient, profileRecipient),
    excludedCompanies: [/(?:^|\b)(?:cognizant|cts)(?:\b|$)/i],
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
      'react native',
      'full stack developer',
      'frontend developer',
      'ui developer'
    ],
    targetCompanies: DEFAULT_TARGET_COMPANIES,
    experience: {
      minYears: 2,
      maxYears: 6,
      excludedSeniority: [
        'director',
        'vp',
        'vice president',
        'head of',
        'principal',
        'intern',
        'internship',
        'fresher',
        'entry level',
        'manager',
        'engineering manager'
      ]
    },
    queryTerms: [
      'plsql developer in India',
      'oracle pl sql in India',
      'oracle developer in India',
      'oracle adf developer in India'
    ],
    keywords: [
      'pl/sql',
      'plsql',
      'oracle sql',
      'oracle database',
      'oracle adf',
      'adf developer',
      'jdeveloper',
      'stored procedure',
      'stored procedures',
      'database developer'
    ],
    skills: [
      {
        tag: '[PL/SQL]',
        patterns: ['pl/sql', 'plsql', 'stored procedure', 'stored procedures', 'packages', 'triggers', 'cursors']
      },
      {
        tag: '[Oracle SQL]',
        patterns: ['oracle', 'oracle sql', 'oracle database', 'oracle db', 'oracle 12c', 'oracle 19c', 'sql query', 'query optimization']
      },
      {
        tag: '[Oracle ADF]',
        patterns: ['oracle adf', 'adf', 'jdeveloper', 'jsf', 'backing bean', 'backing beans']
      },
      {
        tag: '[Power BI]',
        patterns: ['power bi', 'powerbi', 'dax', 'excel reporting', 'business intelligence']
      },
      {
        tag: '[Java]',
        patterns: [/(?:^|[^a-zA-Z0-9])java(?:$|[^a-zA-Z0-9])/i, 'core java', 'j2ee', 'servlets']
      },
      {
        tag: '[Python]',
        patterns: [/(?:^|[^a-zA-Z0-9])python(?:$|[^a-zA-Z0-9])/i, 'pandas', 'numpy']
      },
      {
        tag: '[CI/CD & Git]',
        patterns: ['git', 'jenkins', 'gitlab', 'github', 'version control']
      }
    ],
    defaultTag: '[PL/SQL Developer]',
    accentColor: '#0d9488'
  };
}
