import { DatabaseSync } from 'node:sqlite';
import type { Job } from './types.ts';

export class JobDatabase {
  private db: DatabaseSync;

  constructor(dbPath: string = 'jobs.db') {
    this.db = new DatabaseSync(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Check if table exists
    const checkTable = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='jobs'").get();

    if (!checkTable) {
      this.db.exec(`
        CREATE TABLE jobs (
          id TEXT,
          profile_id TEXT NOT NULL DEFAULT 'power-platform',
          title TEXT NOT NULL,
          company TEXT,
          location TEXT,
          url TEXT NOT NULL,
          tags TEXT,
          source TEXT,
          description TEXT,
          scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
          emailed_at TEXT,
          PRIMARY KEY (profile_id, url)
        );
      `);
    } else {
      // Check if profile_id column exists
      const cols = this.db.prepare('PRAGMA table_info(jobs)').all() as Array<{ name: string }>;
      const hasProfileId = cols.some((c) => c.name === 'profile_id');

      if (!hasProfileId) {
        // Safe migration from single-profile schema to composite (profile_id, url)
        this.db.exec(`
          CREATE TABLE jobs_v2 (
            id TEXT,
            profile_id TEXT NOT NULL DEFAULT 'power-platform',
            title TEXT NOT NULL,
            company TEXT,
            location TEXT,
            url TEXT NOT NULL,
            tags TEXT,
            source TEXT,
            description TEXT,
            scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
            emailed_at TEXT,
            PRIMARY KEY (profile_id, url)
          );
          INSERT OR IGNORE INTO jobs_v2 (id, profile_id, title, company, location, url, tags, source, description, scraped_at, emailed_at)
          SELECT id, 'power-platform', title, company, location, url, tags, source, description, scraped_at, emailed_at FROM jobs;
          DROP TABLE jobs;
          ALTER TABLE jobs_v2 RENAME TO jobs;
        `);
      }
    }

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_jobs_profile_url ON jobs (profile_id, url);
      CREATE INDEX IF NOT EXISTS idx_jobs_profile_emailed ON jobs (profile_id, emailed_at);
    `);
  }

  public getTotalJobCount(profileId?: string): number {
    if (profileId) {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM jobs WHERE profile_id = ?');
      const result = stmt.get(profileId) as { count: number };
      return result?.count ?? 0;
    }
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM jobs');
    const result = stmt.get() as { count: number };
    return result?.count ?? 0;
  }

  public isJobKnown(url: string, profileId: string = 'power-platform'): boolean {
    const stmt = this.db.prepare('SELECT id FROM jobs WHERE profile_id = ? AND url = ?');
    const row = stmt.get(profileId, url);
    return row !== undefined;
  }

  public saveJobIfNew(job: Job, profileId: string = 'power-platform'): boolean {
    const activeProfileId = job.profileId || profileId;
    if (this.isJobKnown(job.url, activeProfileId)) {
      return false;
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO jobs (id, profile_id, title, company, location, url, tags, source, description, scraped_at, emailed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), NULL)
      `);
      stmt.run(
        job.id,
        activeProfileId,
        job.title,
        job.company,
        job.location,
        job.url,
        JSON.stringify(job.tags),
        job.source,
        job.description
      );
      return true;
    } catch {
      return false;
    }
  }

  public filterAndSaveNewJobs(jobs: Job[], profileId: string = 'power-platform'): Job[] {
    const newJobs: Job[] = [];
    for (const job of jobs) {
      if (this.saveJobIfNew(job, profileId)) {
        newJobs.push(job);
      }
    }
    return newJobs;
  }

  public filterNewJobs(jobs: Job[], profileId: string = 'power-platform'): Job[] {
    return jobs.filter((job) => !this.isJobKnown(job.url, job.profileId || profileId));
  }

  public getUnemailedJobs(profileId?: string): Job[] {
    let stmt;
    let rows;
    if (profileId) {
      stmt = this.db.prepare(`
        SELECT id, profile_id, title, company, location, url, tags, source, description, scraped_at
        FROM jobs
        WHERE profile_id = ? AND emailed_at IS NULL
        ORDER BY scraped_at DESC
      `);
      rows = stmt.all(profileId) as Array<any>;
    } else {
      stmt = this.db.prepare(`
        SELECT id, profile_id, title, company, location, url, tags, source, description, scraped_at
        FROM jobs
        WHERE emailed_at IS NULL
        ORDER BY scraped_at DESC
      `);
      rows = stmt.all() as Array<any>;
    }

    return rows.map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      title: row.title,
      company: row.company,
      location: row.location,
      url: row.url,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : [],
      source: row.source,
      description: row.description
    }));
  }

  public markJobsAsEmailed(urls: string[], profileId: string = 'power-platform'): void {
    if (urls.length === 0) return;
    const stmt = this.db.prepare(`
      UPDATE jobs
      SET emailed_at = datetime('now')
      WHERE profile_id = ? AND url = ?
    `);
    for (const url of urls) {
      stmt.run(profileId, url);
    }
  }

  public close(): void {
    this.db.close();
  }
}
