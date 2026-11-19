import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { JobDatabase } from '../src/db/jobDatabase.ts';
import { exportPortalData, isDomesticJob } from '../src/portal/portalDataExporter.ts';
import { generateWebPortal, buildPortalHtml } from '../src/portal/portalPageBuilder.ts';
import type { Job, JobProfile } from '../src/types.ts';

describe('[HF-035, HF-036, HF-037, NF-010, EC-021, EC-022] Web Portal Engine', () => {
  let db: JobDatabase;
  const testProfiles: JobProfile[] = [
    {
      id: 'power-platform',
      name: 'Power Platform Radar',
      candidateName: 'Celine',
      recipientEmail: 'celine@example.com',
      accentColor: '#8b5cf6',
      queryTerms: ['Power Apps'],
      locations: ['India'],
      skills: ['Canvas Apps', 'Dataverse'],
      experienceYears: { minYears: 3, maxYears: 8 }
    },
    {
      id: 'java-backend',
      name: 'Java Backend Radar',
      candidateName: 'Aswin',
      recipientEmail: 'aswin@example.com',
      accentColor: '#ea580c',
      queryTerms: ['Java Developer'],
      locations: ['India'],
      skills: ['Java', 'Spring Boot'],
      experienceYears: { minYears: 2, maxYears: 6 }
    }
  ];

  beforeEach(() => {
    db = new JobDatabase(':memory:');
  });

  describe('[HF-035 & EC-022] exportPortalData: Chronological & Tiered Partitioning', () => {
    it('exports all active 60-day jobs sorted with today on top and tiered by source', () => {
      // 1. Today's Domestic LinkedIn Job (Power Platform)
      db.saveJobIfNew({
        id: 'job-pp-today-domestic',
        title: 'Senior Power Apps Architect',
        company: 'Microsoft Partner',
        location: 'Hyderabad, India',
        url: 'https://linkedin.com/jobs/view/101',
        tags: ['[Canvas Apps]', '[Dataverse]'],
        source: 'jsearch-linkedin',
        description: 'Power Platform architect role'
      }, 'power-platform');

      // 2. Today's Global Remote Job (Power Platform)
      db.saveJobIfNew({
        id: 'job-pp-today-remote',
        title: 'Power Platform Developer (Global Remote)',
        company: 'RemoteTech Inc',
        location: 'Worldwide / Remote',
        url: 'https://jobicy.com/jobs/202',
        tags: ['[Power Automate]'],
        source: 'jobicy',
        description: 'Remote role'
      }, 'power-platform');

      // 3. Yesterday's Domestic Job (Power Platform)
      db.saveJobIfNew({
        id: 'job-pp-yesterday',
        title: 'Lead Power Platform Consultant',
        company: 'Infosys',
        location: 'Bangalore, India',
        url: 'https://naukri.com/job/303',
        tags: ['[PCF]'],
        source: 'jsearch-naukri',
        description: 'Yesterday role'
      }, 'power-platform');
      // @ts-ignore
      db['db'].prepare(`UPDATE jobs SET scraped_at = datetime('now', '-1 day') WHERE id = 'job-pp-yesterday'`).run();

      // 4. Today's Java Job (Java Profile)
      db.saveJobIfNew({
        id: 'job-java-today',
        title: 'Senior Java Backend Engineer',
        company: 'Fintech Corp',
        location: 'Pune, India',
        url: 'https://linkedin.com/jobs/view/404',
        tags: ['[Java]', '[Spring Boot]'],
        source: 'jsearch-linkedin',
        description: 'Java role'
      }, 'java-backend');

      const data = exportPortalData(db, testProfiles);

      assert.strictEqual(data.totalJobsCount, 4);
      assert.strictEqual(data.profiles.length, 2);

      // Verify Power Platform export
      const ppData = data.jobsByProfile['power-platform'];
      assert.ok(ppData, 'Should have entries for power-platform');
      assert.strictEqual(ppData.length, 3);

      // Chronological: Today's jobs must precede yesterday's job
      assert.strictEqual(ppData[0].id, 'job-pp-today-domestic');
      assert.strictEqual(ppData[1].id, 'job-pp-today-remote');
      assert.strictEqual(ppData[2].id, 'job-pp-yesterday');

      // Verify Tier assignment
      assert.strictEqual(ppData[0].tier, 'domestic');
      assert.strictEqual(ppData[1].tier, 'remote');
      assert.strictEqual(ppData[2].tier, 'domestic');

      // Verify Java export
      const javaData = data.jobsByProfile['java-backend'];
      assert.strictEqual(javaData.length, 1);
      assert.strictEqual(javaData[0].id, 'job-java-today');
      assert.strictEqual(javaData[0].tier, 'domestic');

      // Verify candidateName is omitted for privacy on public portal (HF-035)
      data.profiles.forEach((p: any) => {
        assert.strictEqual(p.candidateName, undefined, 'Must not expose candidateName in public portal data');
      });
    });

    it('gracefully handles empty database ([NF-010])', () => {
      const data = exportPortalData(db, testProfiles);
      assert.strictEqual(data.totalJobsCount, 0);
      assert.deepStrictEqual(data.jobsByProfile['power-platform'], []);
      assert.deepStrictEqual(data.jobsByProfile['java-backend'], []);
    });
  });

  describe('[HF-036 & EC-021] generateWebPortal & buildPortalHtml', () => {
    const testOutputDir = path.resolve('test-docs-temp');

    it('generates a clean modular HTML dashboard linking to external CSS and JS [HF-042 & HF-043]', () => {
      // Ingest sample job
      db.saveJobIfNew({
        id: 'job-test-1',
        title: 'Full Stack Engineer',
        company: 'Awesome Startups',
        location: 'Bangalore, India',
        url: 'https://example.com/job-1',
        tags: ['[React]', '[Node.js]'],
        source: 'jsearch-linkedin',
        description: ''
      }, 'power-platform');

      const portalData = exportPortalData(db, testProfiles);
      const html = buildPortalHtml(portalData);

      // 1. Verify Clean HTML Structure & External Asset Links (HF-042)
      assert.ok(html.includes('Job Radar Portal'), 'Must include title');
      assert.ok(html.includes('<link rel="stylesheet" href="styles.css">'), 'Must link to external styles.css');
      assert.ok(html.includes('<script src="app.js"') || html.includes('<script defer src="app.js"'), 'Must link to external app.js');
      assert.ok(!html.includes('<style>\n    :root') && !html.includes('<style>:root'), 'Must NOT have monolithic inline <style> block');
      assert.ok(html.includes('<!-- @portal:app -->') || html.includes('id="app"'), 'Must have root container');

      // 2. Verify Modern Role Dropdown Selector & Unified Filter Toolbar (HF-044 & HF-055)
      assert.ok(html.includes('id="role-select"'), 'Must render scalable role select dropdown (HF-055)');
      assert.ok(html.includes('value="power-platform"'), 'Must render Power Platform role option');
      assert.ok(html.includes('value="java-backend"'), 'Must render Java Backend role option');
      assert.ok(html.includes('id="filter-toolbar"') || html.includes('class="filter-toolbar"'), 'Must render unified filter toolbar');

      // 3. Verify Offline Bootstrap Data Embedded ([EC-021])
      assert.ok(html.includes('id="portal-data"'), 'Must include embedded JSON bootstrap for offline/file:// resilience');
      assert.ok(html.includes('job-test-1'), 'Embedded JSON must contain ingested jobs');

      // 4. Verify Modern UI Component Skeletons
      assert.ok(html.includes('id="kpi-stats-bar"'), 'Must include KPI summary stats bar');
      assert.ok(html.includes('id="kpi-total-jobs"'), 'Must include total jobs KPI card (HF-058)');
      assert.ok(html.includes('id="kpi-today-jobs"'), 'Must include today jobs KPI card (HF-058)');
      assert.strictEqual(html.includes('id="kpi-domestic-jobs"'), false, 'Must NOT include redundant domestic jobs KPI card (HF-058)');
      assert.strictEqual(html.includes('id="kpi-saved-jobs"'), false, 'Must NOT include redundant saved jobs KPI card (HF-058)');
      assert.ok(html.includes('id="theme-toggle"'), 'Must include Dark/Light theme toggle');
      assert.ok(html.includes('id="job-drawer"'), 'Must include slide-over job detail drawer');
      assert.ok(html.includes('id="drawer-overlay"'), 'Must include drawer backdrop overlay');
      assert.strictEqual(html.includes('view-mode-toggle'), false, 'Must NOT include view mode toggle in navbar (HF-057)');
      assert.strictEqual(html.includes('data-view="table"'), false, 'Must NOT include table view button (HF-057)');
      assert.ok(html.includes('id="toast-notification"'), 'Must include toast notification container');

      // 5. Verify User-Facing Region Terminology (HF-045)
      assert.ok(html.includes('All Regions'), 'Toolbar must display "All Regions"');
      assert.ok(!html.includes('All Tiers'), 'Toolbar must NOT display engineering jargon "All Tiers"');

      // 6. Verify Favicon Link (HF-046)
      assert.ok(html.includes('rel="icon"'), 'Must include favicon link');
      assert.ok(html.includes('favicon.svg'), 'Must reference favicon.svg');
    });

    it('writes index.html, styles.css, app.js, and jobs.json to destination folder without error [HF-042 & HF-043]', () => {
      try {
        generateWebPortal(db, testProfiles, testOutputDir);

        const indexPath = path.join(testOutputDir, 'index.html');
        const cssPath = path.join(testOutputDir, 'styles.css');
        const jsPath = path.join(testOutputDir, 'app.js');
        const jsonPath = path.join(testOutputDir, 'jobs.json');
        const nojekyllPath = path.join(testOutputDir, '.nojekyll');
        const faviconPath = path.join(testOutputDir, 'favicon.svg');

        assert.ok(fs.existsSync(indexPath), 'docs/index.html must be generated');
        assert.ok(fs.existsSync(cssPath), 'docs/styles.css must be generated');
        assert.ok(fs.existsSync(jsPath), 'docs/app.js must be generated');
        assert.ok(fs.existsSync(jsonPath), 'docs/jobs.json must be generated');
        assert.ok(fs.existsSync(nojekyllPath), 'docs/.nojekyll must be generated to bypass Jekyll');
        assert.ok(fs.existsSync(faviconPath), 'docs/favicon.svg must be generated (HF-046)');

        const indexContent = fs.readFileSync(indexPath, 'utf-8');
        assert.ok(indexContent.includes('<link rel="stylesheet" href="styles.css">'), 'index.html must reference styles.css');
        assert.ok(indexContent.includes('src="app.js"'), 'index.html must reference app.js');
        assert.ok(!indexContent.includes('<style>\n    :root') && !indexContent.includes('<style>:root'), 'index.html must not contain inline CSS');
        assert.ok(!indexContent.includes('<div class="kpi-icon-wrap" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">\n          📊'), 'KPI cards must not use emoji 📊 (HF-049)');
        assert.ok(indexContent.includes('kpi-icon-svg'), 'KPI cards must use vector SVG icons (HF-049)');
        assert.ok(indexContent.includes('sync-time-badge'), 'index.html must display sync time badge (HF-051)');
        assert.ok(!indexContent.includes('{{LAST_SYNCED_TIME}}'), 'index.html must replace LAST_SYNCED_TIME placeholder (HF-051)');

        const cssContent = fs.readFileSync(cssPath, 'utf-8');
        assert.ok(cssContent.includes(':root') && cssContent.includes('.job-drawer'), 'styles.css must contain CSS rules');
        assert.ok(cssContent.includes('.collapse-chevron') || cssContent.includes('.date-section-block.collapsed'), 'styles.css must contain collapse accordion styles (HF-047)');

        const jsContent = fs.readFileSync(jsPath, 'utf-8');
        assert.ok(jsContent.includes('localStorage'), 'app.js must contain tracker persistence logic');
        assert.ok(jsContent.includes('stopPropagation'), 'app.js must contain action event isolation (HF-043)');
        // HF-057: Grid-Only Architecture & View Toggle Removal
        assert.strictEqual(indexContent.includes('view-mode-toggle'), false, 'index.html must not contain view-mode-toggle (HF-057)');
        assert.strictEqual(jsContent.includes('table-view-container'), false, 'app.js must not render table-view-container (HF-057)');
        assert.strictEqual(jsContent.includes('#view-mode-toggle'), false, 'app.js must not contain view-mode-toggle listener (HF-057)');
        assert.ok(jsContent.includes('collapse-chevron') || jsContent.includes('toggleSectionCollapse'), 'app.js must contain section collapse handlers (HF-047)');
        assert.ok(!jsContent.includes('class="date-header"'), 'app.js must not contain redundant date-header divider bars (HF-048)');
        assert.ok(!jsContent.includes('class="date-section-block"'), 'app.js must not contain date-section-block dividers (HF-048)');
        assert.ok(jsContent.includes('region-section-block'), 'app.js must organize feed directly under regional blocks (HF-048)');
        assert.ok(!jsContent.includes('Domestic Priority</span>'), 'Job cards must not contain redundant Domestic Priority badge (HF-050)');
        assert.ok(!jsContent.includes('Global Remote</span>'), 'Job cards must not contain redundant Global Remote badge (HF-050)');

        // HF-055: Dropdown Select Controls & Deprecation of "Priority" Word
        assert.ok(indexContent.includes('id="role-select"'), 'index.html must contain role-select dropdown (HF-055)');
        assert.ok(indexContent.includes('id="status-select"'), 'index.html must contain status-select dropdown (HF-055)');
        assert.ok(indexContent.includes('id="tier-select"'), 'index.html must contain tier-select dropdown (HF-055)');
        assert.ok(indexContent.includes('id="date-select"'), 'index.html must contain date-select dropdown (HF-055)');
        assert.strictEqual(indexContent.includes('Domestic Priority'), false, 'index.html must not contain "Domestic Priority" (HF-055)');

        // HF-056: In-Section Distinct Company Filter Dropdowns & StopPropagation
        assert.ok(jsContent.includes('section-company-select'), 'app.js must render section-company-select dropdown (HF-056)');
        assert.ok(jsContent.includes('data-section="domestic"'), 'app.js must support domestic section company filter (HF-056)');
        assert.ok(jsContent.includes('data-section="remote"'), 'app.js must support remote section company filter (HF-056)');
        assert.strictEqual(jsContent.includes('Domestic &amp; Regional Priority'), false, 'app.js must not contain Priority in Domestic header (HF-055)');
        assert.ok(jsContent.includes('Domestic &amp; Regional (LinkedIn, Naukri &amp; Corporate Boards)'), 'app.js must render clean Domestic header without Priority (HF-055)');
        assert.ok(jsContent.includes('tier-actions-wrap'), 'app.js must wrap section actions with stopPropagation (HF-056)');
        assert.ok(cssContent.includes('.section-company-select'), 'styles.css must style section-company-select (HF-056)');
        assert.ok(cssContent.includes('.tier-actions-wrap'), 'styles.css must style tier-actions-wrap (HF-056)');

        // HF-058: Minimalist 2-Card KPI Velocity Bar
        assert.ok(indexContent.includes('id="kpi-total-jobs"'), 'index.html must contain total jobs KPI card (HF-058)');
        assert.ok(indexContent.includes('id="kpi-today-jobs"'), 'index.html must contain today jobs KPI card (HF-058)');
        assert.strictEqual(indexContent.includes('id="kpi-domestic-jobs"'), false, 'index.html must not contain domestic KPI card (HF-058)');
        assert.strictEqual(indexContent.includes('id="kpi-saved-jobs"'), false, 'index.html must not contain saved KPI card (HF-058)');

        // HF-050: isDomesticJob classification accuracy
        assert.strictEqual(
          isDomesticJob({ id: 'jsearch-abc', title: 'Developer', company: 'Co', location: 'India', url: 'https://x.com', tags: [], source: 'shine' }),
          true,
          'JSearch jobs must be classified as domestic regardless of scraper aggregator site (HF-050)'
        );
        assert.strictEqual(
          isDomesticJob({ id: 'feed-1', title: 'Developer', company: 'Co', location: 'Bengaluru, India', url: 'https://x.com', tags: [], source: 'custom' }),
          true,
          'India location jobs must be classified as domestic (HF-050)'
        );

        const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        assert.strictEqual(typeof jsonContent.totalJobsCount, 'number');
      } finally {
        if (fs.existsSync(testOutputDir)) {
          fs.rmSync(testOutputDir, { recursive: true, force: true });
        }
      }
    });
  });
});
