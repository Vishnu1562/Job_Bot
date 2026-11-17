import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { JobDatabase } from '../src/db/jobDatabase.ts';
import { exportPortalData } from '../src/portal/portalDataExporter.ts';
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

      // 2. Verify Modern Profile Tab Strip & Unified Filter Strip (HF-044)
      assert.ok(html.includes('id="profile-tabs-strip"') || html.includes('class="profile-tabs-strip"'), 'Must render scalable profile tabs strip');
      assert.ok(html.includes('data-profile="power-platform"'), 'Must render Power Platform tab');
      assert.ok(html.includes('data-profile="java-backend"'), 'Must render Java Backend tab');
      assert.ok(html.includes('id="filter-toolbar"') || html.includes('class="filter-toolbar"'), 'Must render unified filter toolbar');

      // 3. Verify Offline Bootstrap Data Embedded ([EC-021])
      assert.ok(html.includes('id="portal-data"'), 'Must include embedded JSON bootstrap for offline/file:// resilience');
      assert.ok(html.includes('job-test-1'), 'Embedded JSON must contain ingested jobs');

      // 4. Verify Modern UI Component Skeletons
      assert.ok(html.includes('id="kpi-stats-bar"'), 'Must include KPI summary stats bar');
      assert.ok(html.includes('id="theme-toggle"'), 'Must include Dark/Light theme toggle');
      assert.ok(html.includes('id="job-drawer"'), 'Must include slide-over job detail drawer');
      assert.ok(html.includes('id="drawer-overlay"'), 'Must include drawer backdrop overlay');
      assert.ok(html.includes('data-view="grid"') && html.includes('data-view="table"'), 'Must include View Mode switcher buttons');
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

        const cssContent = fs.readFileSync(cssPath, 'utf-8');
        assert.ok(cssContent.includes(':root') && cssContent.includes('.job-drawer'), 'styles.css must contain CSS rules');

        const jsContent = fs.readFileSync(jsPath, 'utf-8');
        assert.ok(jsContent.includes('localStorage'), 'app.js must contain tracker persistence logic');
        assert.ok(jsContent.includes('stopPropagation'), 'app.js must contain action event isolation (HF-043)');
        assert.ok(jsContent.includes('<th>Region</th>'), 'Table header must display Region instead of Tier (HF-045)');
        assert.ok(!jsContent.includes('<th>Tier</th>'), 'Table header must not display Tier');

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
