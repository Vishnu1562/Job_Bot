import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isPowerPlatformJob,
  isIndiaLocation,
  containsNegativeKeywords,
  normalizeUrl,
  validateJob
} from '../src/filter.ts';
import type { RawJobListing } from '../src/types.ts';

describe('Job Filters & Normalization', () => {
  describe('[HF-001 & VR-001] isPowerPlatformJob & validateJob', () => {
    it('accepts relevant Power Platform roles', () => {
      const job: RawJobListing = {
        title: 'Senior Power Apps & Power Automate Developer',
        company: 'Cloud Corp',
        location: 'India',
        description: 'Building custom Canvas Apps, Dataverse solutions, and Power Automate cloud flows.',
        url: 'https://example.com/job1'
      };
      assert.strictEqual(validateJob(job), true);
      assert.strictEqual(isPowerPlatformJob(job), true);
    });

    it('rejects jobs missing title or url (VR-001)', () => {
      const invalidJob = {
        title: '',
        company: 'Acme',
        location: 'India',
        description: 'Power Platform',
        url: ''
      } as RawJobListing;
      assert.strictEqual(validateJob(invalidJob), false);
    });

    it('rejects non-Power Platform IT jobs', () => {
      const job: RawJobListing = {
        title: 'Senior Java Backend Engineer',
        company: 'JavaSoft',
        location: 'Bangalore, India',
        description: 'Spring Boot, Microservices, PostgreSQL.',
        url: 'https://example.com/job2'
      };
      assert.strictEqual(isPowerPlatformJob(job), false);
    });
  });

  describe('[EC-001] isIndiaLocation', () => {
    it('matches Indian cities and country identifiers', () => {
      assert.strictEqual(isIndiaLocation('India'), true);
      assert.strictEqual(isIndiaLocation('Bangalore, Karnataka'), true);
      assert.strictEqual(isIndiaLocation('Bengaluru'), true);
      assert.strictEqual(isIndiaLocation('Hyderabad, Telangana'), true);
      assert.strictEqual(isIndiaLocation('Pune / Hybrid'), true);
      assert.strictEqual(isIndiaLocation('Gurgaon / Gurugram'), true);
      assert.strictEqual(isIndiaLocation('Noida, UP'), true);
      assert.strictEqual(isIndiaLocation('Mumbai, Maharashtra'), true);
      assert.strictEqual(isIndiaLocation('Remote - India'), true);
      assert.strictEqual(isIndiaLocation('Remote (Worldwide)'), true);
      assert.strictEqual(isIndiaLocation('Anywhere'), true);
    });

    it('rejects exclusive non-India regions', () => {
      assert.strictEqual(isIndiaLocation('USA Only'), false);
      assert.strictEqual(isIndiaLocation('Remote - US / Canada only'), false);
      assert.strictEqual(isIndiaLocation('London, UK'), false);
      assert.strictEqual(isIndiaLocation('Berlin, Germany'), false);
    });
  });

  describe('[NF-001] containsNegativeKeywords', () => {
    it('detects unpaid internships and data entry spam', () => {
      const spamJob: RawJobListing = {
        title: 'Unpaid Intern - Excel Data Entry',
        company: 'SpamCorp',
        location: 'India',
        description: 'Excel-only copy paste tasks. Unpaid internship.',
        url: 'https://example.com/spam'
      };
      assert.strictEqual(containsNegativeKeywords(spamJob), true);
    });

    it('passes legitimate tech roles', () => {
      const legitJob: RawJobListing = {
        title: 'Power Platform Solutions Architect',
        company: 'TechGlobal',
        location: 'Remote - India',
        description: 'Design enterprise architecture with Dataverse, Model-Driven Apps, and PCF.',
        url: 'https://example.com/legit'
      };
      assert.strictEqual(containsNegativeKeywords(legitJob), false);
    });
  });

  describe('[EC-003] normalizeUrl', () => {
    it('strips tracking query parameters (utm_source, ref, etc.)', () => {
      const dirtyUrl = 'https://jobs.example.com/view/12345?utm_source=feed&ref=jobicy&source=rss';
      const cleanUrl = normalizeUrl(dirtyUrl);
      assert.strictEqual(cleanUrl, 'https://jobs.example.com/view/12345');
    });
  });
});
