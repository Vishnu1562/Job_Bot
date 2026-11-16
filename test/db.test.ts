import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { JobDatabase } from '../src/db.ts';
import type { Job } from '../src/types.ts';

describe('[HF-003, ST-001, REG-001] SQLite Deduplication Database', () => {
  let db: JobDatabase;

  beforeEach(() => {
    // In-memory database for testing
    db = new JobDatabase(':memory:');
  });

  it('initializes schema correctly (ST-001)', () => {
    const count = db.getTotalJobCount();
    assert.strictEqual(count, 0);
  });

  it('inserts new jobs and ignores duplicates (HF-003)', () => {
    const job1: Job = {
      id: 'job-1',
      title: 'Power Apps Developer',
      company: 'TechCorp',
      location: 'Bangalore, India',
      url: 'https://example.com/job-1',
      tags: ['[Canvas Apps]', '[Dataverse]'],
      source: 'remotive',
      description: 'Test description'
    };

    const isNewFirst = db.saveJobIfNew(job1);
    assert.strictEqual(isNewFirst, true, 'First insert should be recognized as new');

    // Attempting to insert duplicate URL
    const duplicateJob: Job = {
      ...job1,
      id: 'job-1-dup',
      title: 'Power Apps Developer - Reposted'
    };
    const isNewSecond = db.saveJobIfNew(duplicateJob);
    assert.strictEqual(isNewSecond, false, 'Duplicate URL should be rejected');

    assert.strictEqual(db.getTotalJobCount(), 1);
  });

  it('filters an array of scraped jobs to only unemailed/new ones', () => {
    const job1: Job = {
      id: 'job-1',
      title: 'Power Apps Dev',
      company: 'A',
      location: 'India',
      url: 'https://example.com/job-1',
      tags: ['[Canvas Apps]'],
      source: 'remotive',
      description: ''
    };
    const job2: Job = {
      id: 'job-2',
      title: 'Power Automate Dev',
      company: 'B',
      location: 'India',
      url: 'https://example.com/job-2',
      tags: ['[Power Automate]'],
      source: 'jobicy',
      description: ''
    };

    // First run
    const newJobsRun1 = db.filterAndSaveNewJobs([job1, job2]);
    assert.strictEqual(newJobsRun1.length, 2);

    // Second run with identical data (REG-001 regression check)
    const newJobsRun2 = db.filterAndSaveNewJobs([job1, job2]);
    assert.strictEqual(newJobsRun2.length, 0, 'Second run must return 0 new jobs');
  });

  it('marks jobs as emailed', () => {
    const job: Job = {
      id: 'job-1',
      title: 'Power Apps Dev',
      company: 'A',
      location: 'India',
      url: 'https://example.com/job-1',
      tags: ['[Canvas Apps]'],
      source: 'remotive',
      description: ''
    };

    db.filterAndSaveNewJobs([job]);
    const unemailedBefore = db.getUnemailedJobs();
    assert.strictEqual(unemailedBefore.length, 1);

    db.markJobsAsEmailed(['https://example.com/job-1']);
    const unemailedAfter = db.getUnemailedJobs();
    assert.strictEqual(unemailedAfter.length, 0);
  });

  it('deduplicates per profile_id so multiple profiles can receive relevant jobs independently (HF-010)', () => {
    const crossJob: Job = {
      id: 'job-cross',
      title: 'Full Stack & Dynamics Architect',
      company: 'MultiTech',
      location: 'India',
      url: 'https://example.com/job-cross',
      tags: ['[Dynamics 365]', '[.NET]'],
      source: 'remotive',
      description: 'Test'
    };

    // Save for profile 1
    const p1New = db.saveJobIfNew(crossJob, 'power-platform');
    assert.strictEqual(p1New, true);

    // Profile 1 duplicate should be false
    assert.strictEqual(db.saveJobIfNew(crossJob, 'power-platform'), false);

    // Profile 2 should receive it as new
    const p2New = db.saveJobIfNew(crossJob, 'full-stack');
    assert.strictEqual(p2New, true, 'Profile 2 must be allowed to receive the job');

    // Profile 2 duplicate should be false
    assert.strictEqual(db.saveJobIfNew(crossJob, 'full-stack'), false);
  });
});
