import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { getProfiles } from './config/profiles.ts';
import { fetchJobsForProfile } from './scraper.ts';
import { JobDatabase } from './db.ts';
import { generateEmailDigestHtml } from './emailTemplate.ts';
import { sendDigestEmail } from './mailer.ts';

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const dbPath = process.env.DB_PATH || 'jobs.db';

  console.log('=====================================================');
  console.log('🚀 Multi-Profile Job Radar • Morning Automated Scan');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`💾 Database: ${dbPath}`);
  console.log(`⚙️  Mode: ${isDryRun ? 'DRY RUN (no emails sent)' : 'PRODUCTION'}`);
  console.log('=====================================================');

  const profiles = getProfiles();
  console.log(`📋 Loaded ${profiles.length} search profile(s):`);
  profiles.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.id}] ${p.name} -> Recipient: ${p.recipientEmail}`);
  });

  const db = new JobDatabase(dbPath);

  try {
    for (const profile of profiles) {
      console.log(`\n-----------------------------------------------------`);
      console.log(`🎯 Profile [${profile.id}]: ${profile.name}`);
      console.log(`📬 Target Recipient: ${profile.recipientEmail}`);
      console.log(`🔍 Search Queries: ${profile.queryTerms.join(', ')}`);
      console.log(`-----------------------------------------------------`);

      try {
        console.log('[1/4] Scanning free feeds (Remotive, Jobicy, Arbeitnow, RSS)...');
        const scrapedJobs = await fetchJobsForProfile(profile);
        console.log(`[1/4] Found ${scrapedJobs.length} candidate listing(s).`);

        console.log(`[2/4] Deduplicating against persistent SQLite database for profile "${profile.id}"...`);
        const newJobs = db.filterAndSaveNewJobs(scrapedJobs, profile.id);
        console.log(`[2/4] Identified ${newJobs.length} brand new, un-sent role(s).`);

        console.log('[3/4] Generating responsive HTML email digest...');
        const { subject, html, text } = generateEmailDigestHtml(
          newJobs,
          profile.name,
          profile.accentColor,
          profile.candidateName
        );

        if (isDryRun) {
          const previewFile = path.resolve(`preview_${profile.id}.html`);
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
          continue;
        }

        console.log(`[4/4] Dispatching daily digest to ${profile.recipientEmail}: "${subject}"...`);
        await sendDigestEmail(subject, html, { recipientEmail: profile.recipientEmail }, text);

        if (newJobs.length > 0) {
          db.markJobsAsEmailed(newJobs.map((j) => j.url), profile.id);
          console.log(`[4/4] Successfully marked ${newJobs.length} job(s) as sent for profile "${profile.id}".`);
        }
      } catch (profileError: any) {
        console.error(`❌ [${profile.id}] Error executing profile pipeline:`, profileError.message || profileError);
      }
    }

    console.log('\n=====================================================');
    console.log('✅ All Job Radar profiles completed.');
    console.log('=====================================================');
  } catch (err: any) {
    console.error('❌ Critical error executing Job Radar pipeline:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
