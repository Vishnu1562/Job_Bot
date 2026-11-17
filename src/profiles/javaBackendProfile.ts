import type { JobProfile } from '../types.ts';
import { DEFAULT_TARGET_COMPANIES } from './targetCompanies.ts';

export function getJavaBackendProfile(
  env: Record<string, string | undefined> = process.env
): JobProfile {
  const defaultRecipient = env.RECIPIENT_EMAIL || 'user@example.com';

  return {
    id: 'java-backend',
    name: 'Java & Spring Boot Developer Job Radar',
    candidateName: 'Aswin',
    recipientEmail: env.RECIPIENT_EMAIL_JAVA || defaultRecipient,
    excludedCompanies: [/(?:^|\b)(?:tcs|tata\s*consultancy(?:\s*services)?)(?:\b|$)/i],
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
      '.net developer',
      'c# developer'
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
        'entry level'
      ]
    },
    queryTerms: ['java developer', 'spring boot', 'java backend', 'java engineer'],
    keywords: [
      'java',
      'spring',
      'spring boot',
      'springboot',
      'hibernate',
      'microservice',
      'microservices',
      'jpa',
      'rest api',
      'oracle sql',
      'postgresql',
      'docker'
    ],
    skills: [
      {
        tag: '[Spring Boot]',
        patterns: ['spring boot', 'springboot', /\bspring-boot\b/i]
      },
      {
        tag: '[Java]',
        patterns: [/(?:^|[^a-zA-Z0-9])java(?:$|[^a-zA-Z0-9])/i, /\bcore java\b/i]
      },
      {
        tag: '[Hibernate/JPA]',
        patterns: ['hibernate', /\bjpa\b/i, 'spring data jpa']
      },
      {
        tag: '[Microservices]',
        patterns: ['microservice', 'microservices', 'distributed systems']
      },
      {
        tag: '[REST APIs]',
        patterns: ['rest api', 'restful', 'rest apis', 'web services']
      },
      {
        tag: '[Oracle SQL]',
        patterns: ['oracle', 'oracle sql', 'pl/sql', 'plsql']
      },
      {
        tag: '[PostgreSQL]',
        patterns: ['postgresql', 'postgres', /\bpsql\b/i]
      },
      {
        tag: '[Docker]',
        patterns: ['docker', 'containerization', 'containers']
      },
      {
        tag: '[Spring Security / JWT]',
        patterns: ['spring security', 'jwt', 'oauth2', 'authentication']
      },
      {
        tag: '[React]',
        patterns: [/(?:^|[^a-zA-Z0-9])react(?:$|[^a-zA-Z0-9])/i, /\breactjs\b/i]
      },
      {
        tag: '[Python / Shell]',
        patterns: [
          /(?:^|[^a-zA-Z0-9])python(?:$|[^a-zA-Z0-9])/i,
          'shell scripting',
          'bash',
          'runbook',
          'runbooks'
        ]
      }
    ],
    defaultTag: '[Java Developer]',
    accentColor: '#ea580c'
  };
}
