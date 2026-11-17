import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { getProfiles } from './profiles/profileRegistry.ts';
import { fetchJobsForProfile } from './scrapers/scraperCoordinator.ts';
import { JobDatabase } from './db/jobDatabase.ts';
import { generateEmailDigestHtml } from './email/emailTemplate.ts';
import { sendDigestEmail } from './email/mailer.ts';
import { isTargetCompany } from './filters/companyFilter.ts';
import { generateWebPortal } from './portal/index.ts';
import type { Job } from './types.ts';

async function main() {
  const isDryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
  const isForceDispatch = process.argv.includes('--force-dispatch') || process.env.FORCE_DISPATCH === 'true';
  const dbPath = process.env.DB_PATH || 'jobs.db';

  console.log('=====================================================');
  console.log('🚀 Multi-Profile Job Radar • Automated Scan');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`💾 Database: ${dbPath}`);
  console.log(`⚙️  Mode: ${isDryRun ? 'DRY RUN (no emails sent)' : 'PRODUCTION'}${isForceDispatch ? ' [FORCE DISPATCH]' : ''}`);
  const hasRapidApi = Boolean(process.env.RAPIDAPI_KEY?.trim());
  console.log(`🔑 RapidAPI Key: ${hasRapidApi ? `Detected (${process.env.RAPIDAPI_KEY?.trim().slice(0, 5)}...)` : '❌ NOT CONFIGURED (JSearch live LinkedIn/Naukri will be skipped)'}`);
  console.log('=====================================================');

  const profiles = getProfiles();
  console.log(`📋 Loaded ${profiles.length} search profile(s):`);
  profiles.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.id}] ${p.name} -> Recipient: ${p.recipientEmail}`);
  });

  const db = new JobDatabase(dbPath);

  try {
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      console.log(`\n-----------------------------------------------------`);
      console.log(`🎯 Profile [${profile.id}]: ${profile.name}`);
      console.log(`📬 Target Recipient: ${profile.recipientEmail}`);
      console.log(`🔍 Search Queries: ${profile.queryTerms.join(', ')}`);
      console.log(`-----------------------------------------------------`);

      try {
        console.log('[1/4] Scanning free feeds (Remotive, Jobicy, Arbeitnow, RSS)...');
        const scrapedJobs = await fetchJobsForProfile(profile);
        console.log(`[1/4] Found ${scrapedJobs.length} candidate listing(s).`);

        console.log(`[2/4] Updating persistent SQLite queue for profile "${profile.id}"...`);
        let unemailedJobs: Job[];

        if (isDryRun) {
          const existingUnemailed = db.getUnemailedJobs(profile.id);
          const newScraped = db.filterNewJobs(scrapedJobs, profile.id);
          const combined = [...newScraped, ...existingUnemailed];
          const seen = new Set<string>();
          unemailedJobs = combined.filter((j) => {
            if (seen.has(j.url)) return false;
            seen.add(j.url);
            return true;
          });
        } else {
          // 1. Expire unemailed jobs older than 48 hours to prevent queue backlog bloat
          const expiredCount = db.expireOldUnemailedJobs(48, profile.id);
          if (expiredCount > 0) {
            console.log(`[Queue] Archived ${expiredCount} stale role(s) older than 48 hours for profile "${profile.id}".`);
          }

          // 2. 60-day rolling retention: prune old sent/expired records and compact descriptions
          const prunedCount = db.pruneHistoricalJobs(60, profile.id);
          if (prunedCount > 0) {
            console.log(`[Retention] Pruned ${prunedCount} historical role(s) older than 60 days for profile "${profile.id}".`);
          }

          db.filterAndSaveNewJobs(scrapedJobs, profile.id);
          unemailedJobs = db.getUnemailedJobs(profile.id);
        }

        // Decorate target company status for priority ranking
        unemailedJobs.forEach((job) => {
          if (job.isTargetCompany === undefined) {
            job.isTargetCompany = isTargetCompany(job.company, profile);
          }
        });

        console.log(`[2/4] Found ${unemailedJobs.length} total un-sent role(s) (new + queue backlog).`);

        console.log('[3/4] Generating responsive HTML email digest (Top 15 priority)...');
        const { subject, html, text, displayedJobs } = generateEmailDigestHtml(
          unemailedJobs,
          profile.name,
          profile.accentColor,
          profile.candidateName
        );

        if (isDryRun) {
          const previewFile = path.resolve(`preview_${profile.id}.html`);
          fs.writeFileSync(previewFile, html, 'utf-8');
          console.log(`[DryRun] Wrote digest preview to: ${previewFile}`);
          console.log(`[DryRun] Subject: "${subject}"`);
          console.log(`[DryRun] Total queue: ${unemailedJobs.length} role(s) | Displayed in email: ${displayedJobs.length} role(s)`);
          if (displayedJobs.length > 0) {
            displayedJobs.forEach((job, i) => {
              const priority = job.isTargetCompany ? ' [⭐ Priority Target]' : '';
              console.log(`  ${i + 1}. [${job.company}] ${job.title} (${job.location})${priority}`);
              console.log(`     Tags: ${job.tags.join(' ')}`);
              console.log(`     URL: ${job.url}`);
            });
          }
          continue;
        }

        const todayStr = db.getTodayDateString();
        const alreadyDispatched = db.hasDispatchedToday(profile.id, todayStr);

        if (alreadyDispatched && !isForceDispatch) {
          console.log(`[DispatchGuard] Morning digest already dispatched for [${profile.id}] today (${todayStr}).`);
          console.log(`[DispatchGuard] Skipping email to prevent duplicate delivery. (Pass --force-dispatch to override)`);
          continue;
        }

        console.log(`[4/4] Dispatching digest to ${profile.recipientEmail}: "${subject}"...`);
        await sendDigestEmail(subject, html, { recipientEmail: profile.recipientEmail }, text);
        db.recordDispatch(profile.id, todayStr, displayedJobs.length);

        if (displayedJobs.length > 0) {
          const urlsToMark = displayedJobs.map((j) => j.url);
          db.markJobsAsEmailed(urlsToMark, profile.id);
          const remainingInQueue = unemailedJobs.length - displayedJobs.length;
          console.log(`[4/4] Successfully marked ${displayedJobs.length} displayed job(s) as sent. ${remainingInQueue} role(s) remain in queue for next dispatch.`);
        }

        if (!isDryRun && i < profiles.length - 1) {
          console.log(`[Throttler] Waiting 2s before next profile dispatch to prevent SMTP burst flags...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (profileError: any) {
        console.error(`❌ [${profile.id}] Error executing profile pipeline:`, profileError.message || profileError);
      }
    }

    // Generate static Web Portal dashboard into docs/
    console.log('\n[Portal] Generating static web dashboard into docs/...');
    const { portalData } = generateWebPortal(db, profiles, 'docs');
    console.log(`[Portal] Generated dashboard for ${portalData.totalJobsCount} active role(s) across ${portalData.profiles.length} profile(s).`);

    if (!isDryRun) {
      db.vacuum();
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
