import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { JobDatabase } from '../src/db/jobDatabase.ts';
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

  it('supports FIFO queue roll-over: marks only displayed jobs as emailed and preserves unemailed backlog (HF-021)', () => {
    const jobs: Job[] = Array.from({ length: 5 }, (_, i) => ({
      id: `job-queue-${i + 1}`,
      title: `Developer ${i + 1}`,
      company: `Company ${i + 1}`,
      location: 'India',
      url: `https://example.com/job-queue-${i + 1}`,
      tags: ['[Java]'],
      source: 'remotive',
      description: ''
    }));

    // Ingest all 5 jobs into database
    db.filterAndSaveNewJobs(jobs, 'java-backend');
    assert.strictEqual(db.getUnemailedJobs('java-backend').length, 5);

    // Simulate sending Top 2 in the morning dispatch
    const displayedUrls = [jobs[0].url, jobs[1].url];
    db.markJobsAsEmailed(displayedUrls, 'java-backend');

    // Verify 3 jobs remain in queue for evening dispatch
    const remainingQueue = db.getUnemailedJobs('java-backend');
    assert.strictEqual(remainingQueue.length, 3, 'Queue backlog must retain the 3 un-displayed jobs');
    const remainingUrls = remainingQueue.map((j) => j.url);
    assert.ok(remainingUrls.includes('https://example.com/job-queue-3'));
    assert.ok(remainingUrls.includes('https://example.com/job-queue-4'));
    assert.ok(remainingUrls.includes('https://example.com/job-queue-5'));
  });

  it('expires unemailed jobs older than threshold (e.g. 48 hours) (HF-028)', () => {
    // Insert job 1 (simulated 50 hours old)
    db.saveJobIfNew({
      id: 'job-old',
      title: 'Old Stale Role',
      company: 'OldCo',
      location: 'India',
      url: 'https://example.com/job-old',
      tags: ['[Java]'],
      source: 'remotive',
      description: ''
    }, 'java-backend');

    // Manually push scraped_at timestamp back 50 hours
    // @ts-ignore
    db['db'].prepare(`UPDATE jobs SET scraped_at = datetime('now', '-50 hours') WHERE id = 'job-old'`).run();

    // Insert job 2 (fresh current timestamp)
    db.saveJobIfNew({
      id: 'job-fresh',
      title: 'Fresh Today Role',
      company: 'FreshCo',
      location: 'India',
      url: 'https://example.com/job-fresh',
      tags: ['[Java]'],
      source: 'remotive',
      description: ''
    }, 'java-backend');

    assert.strictEqual(db.getUnemailedJobs('java-backend').length, 2);

    // Expire jobs older than 48 hours
    const expiredCount = db.expireOldUnemailedJobs(48, 'java-backend');
    assert.strictEqual(expiredCount, 1, 'Should expire exactly 1 old unemailed role');

    // Verify only the fresh job remains in active queue
    const activeQueue = db.getUnemailedJobs('java-backend');
    assert.strictEqual(activeQueue.length, 1);
    assert.strictEqual(activeQueue[0].id, 'job-fresh');
  });

  describe('[HF-033, HF-034, EC-020] 60-Day Rolling Window Retention & Deduplication', () => {
    it('prunes sent/expired jobs older than 60 days while compacting descriptions (HF-033 & EC-020)', () => {
      // 1. Emailed job 70 days ago (should be deleted)
      db.saveJobIfNew({
        id: 'job-70-days',
        title: '70 Day Old Role',
        company: 'Old Corp',
        location: 'India',
        url: 'https://example.com/job-70-days',
        tags: ['[Java]'],
        source: 'linkedin',
        description: 'Large job description text'
      }, 'java-backend');
      // @ts-ignore
      db['db'].prepare(`UPDATE jobs SET scraped_at = datetime('now', '-70 days'), emailed_at = datetime('now', '-65 days') WHERE id = 'job-70-days'`).run();

      // 2. Emailed job 10 days ago (should be kept for deduplication, but description compacted)
      db.saveJobIfNew({
        id: 'job-10-days',
        title: '10 Day Old Role',
        company: 'Recent Corp',
        location: 'India',
        url: 'https://example.com/job-10-days',
        tags: ['[Java]'],
        source: 'linkedin',
        description: 'Large job description text to be compacted'
      }, 'java-backend');
      // @ts-ignore
      db['db'].prepare(`UPDATE jobs SET scraped_at = datetime('now', '-10 days'), emailed_at = datetime('now', '-10 days') WHERE id = 'job-10-days'`).run();

      // 3. Unemailed job in active queue (must be immune from prune - EC-020)
      db.saveJobIfNew({
        id: 'job-unemailed',
        title: 'Active Queue Role',
        company: 'Active Corp',
        location: 'India',
        url: 'https://example.com/job-active',
        tags: ['[Java]'],
        source: 'linkedin',
        description: 'Active description'
      }, 'java-backend');

      assert.strictEqual(db.getTotalJobCount('java-backend'), 3);

      const prunedCount = db.pruneHistoricalJobs(60);
      assert.strictEqual(prunedCount, 1, 'Should prune exactly 1 job older than 60 days');

      // Total count should now be 2
      assert.strictEqual(db.getTotalJobCount('java-backend'), 2);

      // 70 day old job is gone
      assert.strictEqual(db.isJobKnown('https://example.com/job-70-days', 'java-backend'), false);

      // 10 day old job is retained for deduplication (HF-034)
      assert.strictEqual(db.isJobKnown('https://example.com/job-10-days', 'java-backend'), true);
      // Description is compacted to NULL to save space
      // @ts-ignore
      const retainedJob = db['db'].prepare(`SELECT description FROM jobs WHERE id = 'job-10-days'`).get() as { description: string | null };
      assert.strictEqual(retainedJob.description, null, 'Emailed job description should be cleared to conserve SQLite storage');

      // Active unemailed job is preserved intact (EC-020)
      assert.strictEqual(db.isJobKnown('https://example.com/job-active', 'java-backend'), true);
      const queue = db.getUnemailedJobs('java-backend');
      assert.strictEqual(queue.length, 1);
      assert.strictEqual(queue[0].id, 'job-unemailed');
      assert.strictEqual(queue[0].description, 'Active description');
    });

    it('guarantees zero duplicate re-ingestion for jobs seen within retention window (HF-034)', () => {
      // Ingest a job and mark as sent
      const job: Job = {
        id: 'job-unique-1',
        title: 'Senior Developer',
        company: 'Prime Tech',
        location: 'Bangalore, India',
        url: 'https://example.com/prime-101',
        tags: ['[Java]'],
        source: 'linkedin',
        description: ''
      };

      assert.strictEqual(db.saveJobIfNew(job, 'java-backend'), true);
      db.markJobsAsEmailed([job.url], 'java-backend');

      // Attempting to re-ingest identical job on subsequent days
      const isNewSecondDay = db.saveJobIfNew(job, 'java-backend');
      assert.strictEqual(isNewSecondDay, false, 'Must reject previously emailed jobs as duplicates');

      // Verify it is not re-queued
      const queue = db.getUnemailedJobs('java-backend');
      assert.strictEqual(queue.length, 0, 'Emailed job must never appear in unemailed queue');
    });
  });
});
