import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractRequiredExperience, isExperienceMatching } from '../src/filters/experienceFilter.ts';
import type { JobProfile, RawJobListing } from '../src/types.ts';

describe('[HF-014, HF-015, NF-005, NF-006, EC-007] Experience Level Parsing & Filtering', () => {
  const sampleProfile: JobProfile = {
    id: 'java-backend',
    name: 'Java & Spring Boot Developer Job Radar',
    recipientEmail: 'dev@example.com',
    experience: {
      minYears: 2,
      maxYears: 6,
      excludedSeniority: ['director', 'vp', 'vice president', 'head of', 'principal', 'intern', 'fresher']
    },
    queryTerms: ['java'],
    keywords: ['java'],
    skills: [],
    defaultTag: '[Java Developer]'
  };

  describe('[EC-007] extractRequiredExperience', () => {
    it('parses range "3-5 years of experience"', () => {
      const exp = extractRequiredExperience('Looking for someone with 3-5 years of experience in Java.');
      assert.deepStrictEqual(exp, { minYears: 3, maxYears: 5 });
    });

    it('parses range "2 to 4 years"', () => {
      const exp = extractRequiredExperience('Requires 2 to 4 years of hands-on Spring Boot development.');
      assert.deepStrictEqual(exp, { minYears: 2, maxYears: 4 });
    });

    it('parses "4+ years of experience"', () => {
      const exp = extractRequiredExperience('Must have 4+ years of enterprise software engineering experience.');
      assert.deepStrictEqual(exp, { minYears: 4, maxYears: undefined });
    });

    it('parses "minimum 5 years"', () => {
      const exp = extractRequiredExperience('Minimum 5 years of backend engineering required.');
      assert.deepStrictEqual(exp, { minYears: 5, maxYears: undefined });
    });

    it('returns null when no experience statement is present and ignores calendar years/versions', () => {
      const exp = extractRequiredExperience('Company founded in 2021. Developing with Java 17 and Angular 18.');
      assert.strictEqual(exp, null);
    });
  });

  describe('[HF-014, NF-005] Experience Range Matching', () => {
    it('accepts jobs within profile range (2-6 years)', () => {
      const job1: RawJobListing = {
        title: 'Java Backend Developer',
        company: 'FinTech',
        location: 'India',
        description: 'Requires 3 to 5 years of experience with Spring Boot and Oracle SQL.',
        url: 'https://example.com/job1'
      };
      assert.strictEqual(isExperienceMatching(job1, sampleProfile), true);

      const job2: RawJobListing = {
        title: 'Software Engineer',
        company: 'Cloud Corp',
        location: 'India',
        description: '4+ years of Java experience.',
        url: 'https://example.com/job2'
      };
      assert.strictEqual(isExperienceMatching(job2, sampleProfile), true);
    });

    it('rejects overqualified jobs (e.g. 10+ years or 8-10 years) (NF-005)', () => {
      const overqualifiedJob1: RawJobListing = {
        title: 'Lead Architect',
        company: 'Enterprise Inc',
        location: 'India',
        description: 'Must have 10+ years of experience in enterprise systems.',
        url: 'https://example.com/over1'
      };
      assert.strictEqual(isExperienceMatching(overqualifiedJob1, sampleProfile), false);

      const overqualifiedJob2: RawJobListing = {
        title: 'Staff Engineer',
        company: 'Enterprise Inc',
        location: 'India',
        description: 'Requires 8-10 years of software engineering experience.',
        url: 'https://example.com/over2'
      };
      assert.strictEqual(isExperienceMatching(overqualifiedJob2, sampleProfile), false);
    });

    it('rejects underqualified fresher/intern roles requiring 0-1 years (NF-005)', () => {
      const fresherJob: RawJobListing = {
        title: 'Junior Java Developer',
        company: 'StartUp',
        location: 'India',
        description: 'Entry-level position. 0-1 years of experience required.',
        url: 'https://example.com/junior'
      };
      assert.strictEqual(isExperienceMatching(fresherJob, sampleProfile), false);
    });
  });

  describe('[NF-006 & HF-015] Seniority Titles & Unspecified Experience', () => {
    it('accepts unstated experience when title is a standard developer role (HF-015)', () => {
      const unstatedJob: RawJobListing = {
        title: 'Java & Spring Boot Developer',
        company: 'TCS Partner',
        location: 'India',
        description: 'We are seeking a developer proficient in Hibernate, REST APIs, and Docker.',
        url: 'https://example.com/unstated'
      };
      assert.strictEqual(isExperienceMatching(unstatedJob, sampleProfile), true);
    });

    it('rejects excluded leadership or fresher seniority titles even with unstated years (NF-006)', () => {
      const directorJob: RawJobListing = {
        title: 'Director of Java Engineering',
        company: 'BigCorp',
        location: 'India',
        description: 'Leading a team of 40 engineers building backend systems.',
        url: 'https://example.com/director'
      };
      assert.strictEqual(isExperienceMatching(directorJob, sampleProfile), false);

      const vpJob: RawJobListing = {
        title: 'VP of Technology',
        company: 'Global Bank',
        location: 'India',
        description: 'Heading cloud infrastructure.',
        url: 'https://example.com/vp'
      };
      assert.strictEqual(isExperienceMatching(vpJob, sampleProfile), false);

      const internJob: RawJobListing = {
        title: 'Java Software Intern',
        company: 'Student Hub',
        location: 'India',
        description: 'Internship role.',
        url: 'https://example.com/intern'
      };
      assert.strictEqual(isExperienceMatching(internJob, sampleProfile), false);
    });
  });
});
