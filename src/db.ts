import { DatabaseSync } from 'node:sqlite';
import type { Job } from './types.ts';

export class JobDatabase {
  private db: DatabaseSync;

  constructor(dbPath: string = 'jobs.db') {
    this.db = new DatabaseSync(dbPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT,
        location TEXT,
        url TEXT UNIQUE NOT NULL,
        tags TEXT,
        source TEXT,
        description TEXT,
        scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
        emailed_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_jobs_url ON jobs (url);
      CREATE INDEX IF NOT EXISTS idx_jobs_emailed_at ON jobs (emailed_at);
    `);
  }

  public getTotalJobCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM jobs');
    const result = stmt.get() as { count: number };
    return result?.count ?? 0;
  }

  public isJobKnown(url: string): boolean {
    const stmt = this.db.prepare('SELECT id FROM jobs WHERE url = ?');
    const row = stmt.get(url);
    return row !== undefined;
  }

  public saveJobIfNew(job: Job): boolean {
    if (this.isJobKnown(job.url)) {
      return false;
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO jobs (id, title, company, location, url, tags, source, description, scraped_at, emailed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), NULL)
      `);
      stmt.run(
        job.id,
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

  public filterAndSaveNewJobs(jobs: Job[]): Job[] {
    const newJobs: Job[] = [];
    for (const job of jobs) {
      if (this.saveJobIfNew(job)) {
        newJobs.push(job);
      }
    }
    return newJobs;
  }

  public getUnemailedJobs(): Job[] {
    const stmt = this.db.prepare(`
      SELECT id, title, company, location, url, tags, source, description, scraped_at
      FROM jobs
      WHERE emailed_at IS NULL
      ORDER BY scraped_at DESC
    `);
    const rows = stmt.all() as Array<{
      id: string;
      title: string;
      company: string;
      location: string;
      url: string;
      tags: string;
      source: string;
      description: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      company: row.company,
      location: row.location,
      url: row.url,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : [],
      source: row.source,
      description: row.description
    }));
  }

  public markJobsAsEmailed(urls: string[]): void {
    if (urls.length === 0) return;
    const stmt = this.db.prepare(`
      UPDATE jobs
      SET emailed_at = datetime('now')
      WHERE url = ?
    `);
    for (const url of urls) {
      stmt.run(url);
    }
  }

  public close(): void {
    this.db.close();
  }
}
