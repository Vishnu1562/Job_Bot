import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fetchPowerPlatformJobs } from './scraper.ts';
import { JobDatabase } from './db.ts';
import { generateEmailDigestHtml } from './emailTemplate.ts';
import { sendDigestEmail } from './mailer.ts';

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const dbPath = process.env.DB_PATH || 'jobs.db';

  console.log('=====================================================');
  console.log('🚀 Power Platform Job Radar • Morning Automated Scan');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`📍 Target: India & Worldwide Remote`);
  console.log(`💾 Database: ${dbPath}`);
  console.log(`⚙️  Mode: ${isDryRun ? 'DRY RUN (no email sent)' : 'PRODUCTION'}`);
  console.log('=====================================================');

  const db = new JobDatabase(dbPath);

  try {
    console.log('[1/4] Scanning free feeds (Remotive, Jobicy, Arbeitnow, RSS)...');
    const scrapedJobs = await fetchPowerPlatformJobs();
    console.log(`[1/4] Found ${scrapedJobs.length} matching candidate listings.`);

    console.log('[2/4] Deduplicating against persistent SQLite database...');
    const newJobs = db.filterAndSaveNewJobs(scrapedJobs);
    console.log(`[2/4] Identified ${newJobs.length} brand new, un-sent role(s).`);

    console.log('[3/4] Generating responsive HTML email digest...');
    const { subject, html } = generateEmailDigestHtml(newJobs);

    if (isDryRun) {
      const previewFile = path.resolve('preview_digest.html');
      fs.writeFileSync(previewFile, html, 'utf-8');
      console.log(`[DryRun] Wrote digest preview to: ${previewFile}`);
      console.log(`[DryRun] Subject: "${subject}"`);
      console.log(`[DryRun] New jobs count: ${newJobs.length}`);
      if (newJobs.length > 0) {
        newJobs.forEach((job, i) => {
          console.log(`  ${i + 1}. [${job.company}] ${job.title} (${job.location})`);
          console.log(`     Tags: ${job.tags.join(' ')}`);
          console.log(`     URL: ${job.url}`);
        });
      }
      return;
    }

    console.log(`[4/4] Dispatching daily digest via Gmail SMTP: "${subject}"...`);
    await sendDigestEmail(subject, html);

    if (newJobs.length > 0) {
      db.markJobsAsEmailed(newJobs.map((j) => j.url));
      console.log(`[4/4] Successfully marked ${newJobs.length} job(s) as sent in jobs.db.`);
    }

    console.log('=====================================================');
    console.log('✅ Power Platform Job Radar scan completed successfully.');
    console.log('=====================================================');
  } catch (err: any) {
    console.error('❌ Error executing Job Radar pipeline:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
