import type { JobProfile } from '../types.ts';
import { DEFAULT_TARGET_COMPANIES } from './targetCompanies.ts';

export function getPowerPlatformProfile(
  env: Record<string, string | undefined> = process.env
): JobProfile {
  const defaultRecipient = env.RECIPIENT_EMAIL || 'user@example.com';

  return {
    id: 'power-platform',
    name: 'Power Platform Job Radar',
    candidateName: 'Celine',
    recipientEmail: env.RECIPIENT_EMAIL_POWERPLATFORM || defaultRecipient,
    excludedCompanies: [/\bwipro\b/i],
    excludedTitleKeywords: [
      'magento',
      'wordpress',
      'shopify',
      'drupal',
      'php developer',
      'ruby',
      'ios developer',
      'android developer'
    ],
    targetCompanies: DEFAULT_TARGET_COMPANIES,
    experience: {
      minYears: 3,
      maxYears: 8,
      excludedSeniority: [
        'director',
        'vp',
        'vice president',
        'head of',
        'intern',
        'internship',
        'fresher',
        'entry level'
      ]
    },
    queryTerms: [
      'power apps developer',
      'power platform',
      'power automate',
      'sharepoint power apps'
    ],
    keywords: [
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
      'dynamics 365',
      'sharepoint',
      'sharegate',
      'm365',
      'pl-400'
    ],
    skills: [
      {
        tag: '[Canvas Apps]',
        patterns: ['canvas app', 'canvas apps', /\bcanvas\b/i]
      },
      {
        tag: '[Power Automate]',
        patterns: [
          'power automate',
          'powerautomate',
          'cloud flow',
          'ms flow',
          'flow designer',
          'approval workflow'
        ]
      },
      {
        tag: '[Dataverse]',
        patterns: ['dataverse', 'common data service', /\bcds\b/i]
      },
      {
        tag: '[SharePoint Online]',
        patterns: ['sharepoint', 'sharepoint online', /\bspo\b/i, 'sharegate']
      },
      {
        tag: '[M365 / PL-400]',
        patterns: ['microsoft 365', 'm365', 'pl-400', 'pl 400']
      },
      {
        tag: '[Copilot Studio]',
        patterns: ['copilot studio', 'power virtual agents', /\bpva\b/i, 'copilot']
      },
      {
        tag: '[Model-Driven]',
        patterns: ['model driven', 'model-driven', 'modeldriven']
      },
      {
        tag: '[Power Pages]',
        patterns: ['power pages', 'powerpages', 'power portals', 'power apps portal']
      },
      {
        tag: '[PCF]',
        patterns: [
          'pcf',
          'power apps component framework',
          'powerapps component framework'
        ]
      },
      {
        tag: '[Dynamics 365]',
        patterns: ['dynamics 365', /\bd365\b/i, 'dynamics crm']
      }
    ],
    defaultTag: '[Power Apps Developer]',
    accentColor: '#742774'
  };
}
