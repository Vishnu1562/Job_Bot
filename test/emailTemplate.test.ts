import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateEmailDigestHtml } from '../src/email/emailTemplate.ts';
import type { Job } from '../src/types.ts';

describe('[HF-004, HF-005, EC-002] Responsive Email Template Generator', () => {
  it('generates rich HTML digest when new jobs are present (HF-004)', () => {
    const jobs: Job[] = [
      {
        id: '1',
        title: 'Lead Power Platform Architect',
        company: 'Infosys',
        location: 'Hyderabad, India',
        url: 'https://example.com/apply-infosys',
        tags: ['[Canvas Apps]', '[Dataverse]', '[PCF]'],
        source: 'arbeitnow',
        description: 'Lead enterprise architecture.'
      }
    ];

    const { subject, html, text } = generateEmailDigestHtml(jobs);

    assert.ok(subject.includes('1 New Roles Found Today') || subject.includes('1 New Role'));
    assert.ok(html.includes('Lead Power Platform Architect'));
    assert.ok(html.includes('Infosys'));
    assert.ok(html.includes('Hyderabad, India'));
    assert.ok(html.includes('[Canvas Apps]'));
    assert.ok(html.includes('[Dataverse]'));
    assert.ok(html.includes('[PCF]'));
    assert.ok(html.includes('Apply Now ↗'), 'Must render clean unicode arrow in Apply button');
    assert.ok(!html.includes('&nearr;'), 'Must not render raw &nearr; entity in button text');
    assert.ok(html.includes('https://example.com/apply-infosys'));
    assert.ok(typeof text === 'string' && text.includes('Lead Power Platform Architect'), 'Must generate plain-text fallback');
  });

  it('generates status digest when 0 new jobs are found (HF-005)', () => {
    const { subject, html } = generateEmailDigestHtml([]);

    assert.ok(subject.includes('0 New Roles Found Today'));
    assert.ok(html.includes('0 New Roles'));
    assert.ok(html.includes("it's completely fine!") || html.includes('completely fine'));
  });

  it('escapes special characters to prevent HTML corruption (EC-002)', () => {
    const unsafeJob: Job = {
      id: '2',
      title: 'Power Apps <Lead> & "Architect"',
      company: 'AT&T / Tech',
      location: 'Bangalore & Remote',
      url: 'https://example.com/test?a=1&b=2',
      tags: ['[Canvas Apps]'],
      source: 'jobicy',
      description: 'Test'
    };

    const { html } = generateEmailDigestHtml([unsafeJob]);

    assert.ok(!html.includes('<Lead>'), 'Raw HTML tag <Lead> must be escaped');
    assert.ok(html.includes('&lt;Lead&gt;'));
    assert.ok(html.includes('AT&amp;T') || html.includes('AT&T'));
  });

  it('supports custom profile titles (e.g. Full Stack Developer Job Radar) (HF-004 & EC-005)', () => {
    const { subject, html } = generateEmailDigestHtml([], 'Full Stack Developer Job Radar');
    assert.ok(subject.includes('Full Stack Developer Job Radar'));
    assert.ok(html.includes('Full Stack Developer Job Radar'));
  });

  describe('[HF-018] Personalized & Motivating Email Digest Template', () => {
    const sampleJob: Job = {
      id: '1',
      title: 'Senior Java Backend Engineer',
      company: 'FinTech Corp',
      location: 'Kochi, India',
      url: 'https://example.com/apply-fintech',
      tags: ['[Spring Boot]', '[Java]'],
      source: 'jobicy',
      description: 'Java enterprise'
    };

    it('renders warm personalized greeting card for candidate when jobs are found', () => {
      const { html } = generateEmailDigestHtml([sampleJob], 'Java & Spring Boot Developer Job Radar', '#ea580c', 'Aswin');
      assert.ok(html.includes('Hey Aswin!'));
      assert.ok(html.includes('you will find the right role'));
      assert.ok(html.includes('Senior Java Backend Engineer'));
    });

    it('renders encouraging personalized message when 0 jobs are found', () => {
      const { html } = generateEmailDigestHtml([], 'Java & Spring Boot Developer Job Radar', '#ea580c', 'Aswin');
      assert.ok(html.includes("Hey Aswin, it's completely fine!"));
      assert.ok(html.includes('find the right fit'));
      assert.ok(html.includes('Stay confident and keep going!'));
    });

    it('removes robotic developer infrastructure text from footer', () => {
      const { html } = generateEmailDigestHtml([sampleJob], 'Power Platform Job Radar', '#742774', 'Celine');
      assert.ok(!html.includes('running 24/7 on GitHub Actions'), 'Should not contain GitHub Actions bot text');
      assert.ok(!html.includes('Tracked via SQLite'), 'Should not contain SQLite tracking text');
      assert.ok(!html.includes('Zero Server Costs'), 'Should not contain Zero Server Costs text');
      assert.ok(html.includes('Curated with care'));
      assert.ok(html.includes('Celine'));
    });

    it('defaults gracefully to friendly generic greeting when candidate name is omitted', () => {
      const { html } = generateEmailDigestHtml([sampleJob]);
      assert.ok(html.includes('Hey there!'));
      assert.ok(!html.includes('undefined'));
    });

    it('prioritizes target company jobs at the top and displays badge (HF-019)', () => {
      const regularJob: Job = {
        id: '1',
        title: 'Backend Engineer',
        company: 'Standard Startup',
        location: 'Remote, India',
        url: 'https://example.com/job-regular',
        tags: ['[Java]'],
        source: 'remotive',
        description: 'Regular job',
        isTargetCompany: false
      };

      const targetJob: Job = {
        id: '2',
        title: 'Senior Java Architect',
        company: 'UST Global',
        location: 'Kochi Infopark, India',
        url: 'https://example.com/job-ust',
        tags: ['[Spring Boot]', '[Java]'],
        source: 'jobicy',
        description: 'Target company job',
        isTargetCompany: true
      };

      // Even if regularJob is first in the array, targetJob should be sorted to the top
      const { html } = generateEmailDigestHtml([regularJob, targetJob], 'Java & Spring Boot Developer Job Radar', '#ea580c', 'Aswin');

      assert.ok(html.includes('⭐ Priority Target'), 'Must include Priority Target badge');
      const ustIndex = html.indexOf('UST Global');
      const standardIndex = html.indexOf('Standard Startup');
      assert.ok(ustIndex < standardIndex, 'UST Global (Target Company) must appear before Standard Startup');
    });

    it('caps displayed jobs to top 15 and shows overflow card when more than 15 jobs are found (HF-021)', () => {
      // Create 20 jobs
      const jobs: Job[] = Array.from({ length: 20 }, (_, i) => ({
        id: `job-${i + 1}`,
        title: `Full Stack Engineer Level ${i + 1}`,
        company: i === 18 ? 'Microsoft' : `Company ${i + 1}`,
        location: 'Bangalore, India',
        url: `https://example.com/job-${i + 1}`,
        tags: ['[Angular]', '[NestJS]'],
        source: 'remotive',
        description: `Description ${i + 1}`,
        isTargetCompany: i === 18 // Job 19 is Microsoft (Priority Target)
      }));

      const { html, text, displayedJobs } = generateEmailDigestHtml(jobs, 'Full Stack Developer Job Radar', '#0284c7', 'Vishnu');

      assert.strictEqual(displayedJobs.length, 15, 'Must return exactly 15 displayedJobs for dispatch tracking');

      // Microsoft should be sorted to the top and thus included in top 15
      assert.ok(html.includes('Microsoft'), 'Priority target Microsoft must be included in top 15');
      assert.ok(html.includes('Full Stack Engineer Level 19'));

      // Count occurrences of "Apply Now ↗" (each job card has exactly 1)
      const buttonMatches = html.match(/Apply Now ↗/g);
      assert.strictEqual(buttonMatches?.length, 15, 'Must render exactly 15 Apply Now buttons');

      // Overflow indicator should show +5 additional roles
      assert.ok(html.includes('+5 additional roles identified today'), 'HTML must include +5 overflow note');
      assert.ok(html.includes('Top 15 priority matches displayed above'));
      assert.ok(text.includes('+ 5 additional role(s) identified today'), 'Plain text must include overflow note');
      assert.ok(text.includes('Top 15 priority matches displayed above'));
    });

    it('does not display overflow card when total jobs are 15 or fewer (HF-021)', () => {
      const jobs: Job[] = Array.from({ length: 5 }, (_, i) => ({
        id: `job-${i + 1}`,
        title: `Java Developer ${i + 1}`,
        company: `Company ${i + 1}`,
        location: 'Remote, India',
        url: `https://example.com/job-${i + 1}`,
        tags: ['[Java]'],
        source: 'arbeitnow',
        description: `Description ${i + 1}`
      }));

      const { html, text } = generateEmailDigestHtml(jobs, 'Java & Spring Boot Developer Job Radar', '#ea580c', 'Aswin');

      const buttonMatches = html.match(/Apply Now ↗/g);
      assert.strictEqual(buttonMatches?.length, 5, 'Must render all 5 Apply Now buttons');
      assert.ok(!html.includes('additional roles identified today'), 'Should NOT display overflow note');
      assert.ok(!text.includes('additional role(s) identified today'));
    });

    it('prioritizes JSearch LinkedIn and Naukri jobs above generic remote feeds within the Top 15 cap (HF-023)', () => {
      // 15 generic WeWorkRemotely jobs
      const wwrJobs: Job[] = Array.from({ length: 15 }, (_, i) => ({
        id: `wwr-${i + 1}`,
        title: `Generic Remote Developer ${i + 1}`,
        company: `Remote Startup ${i + 1}`,
        location: 'Remote Worldwide',
        url: `https://weworkremotely.com/jobs/${i + 1}`,
        tags: ['[Java]'],
        source: 'weworkremotely',
        description: `WWR job ${i + 1}`
      }));

      // 2 JSearch LinkedIn and Naukri jobs added at the end of the array
      const linkedInJob: Job = {
        id: 'jsearch-li-101',
        title: 'Lead Java Engineer (LinkedIn India)',
        company: 'Kochi FinTech Ltd',
        location: 'Infopark Kochi, Kerala',
        url: 'https://in.linkedin.com/jobs/view/101',
        tags: ['[Java]', '[Spring Boot]'],
        source: 'linkedin',
        description: 'LinkedIn India job'
      };

      const naukriJob: Job = {
        id: 'jsearch-nk-102',
        title: 'Senior Spring Boot Architect (Naukri)',
        company: 'Bengaluru Tech Park',
        location: 'Whitefield, Bengaluru, India',
        url: 'https://www.naukri.com/job-102',
        tags: ['[Java]', '[Microservices]'],
        source: 'naukri',
        description: 'Naukri job'
      };

      // Combined array has 17 jobs with LinkedIn and Naukri placed at the very end
      const allJobs = [...wwrJobs, linkedInJob, naukriJob];

      const { html } = generateEmailDigestHtml(allJobs, 'Java & Spring Boot Developer Job Radar', '#ea580c', 'Aswin');

      // Both LinkedIn and Naukri jobs MUST be included in the top 15
      assert.ok(html.includes('Lead Java Engineer (LinkedIn India)'), 'LinkedIn job must be included in top 15');
      assert.ok(html.includes('Senior Spring Boot Architect (Naukri)'), 'Naukri job must be included in top 15');

      // Furthermore, LinkedIn and Naukri jobs must be rendered BEFORE the generic WWR jobs
      const linkedInIndex = html.indexOf('Lead Java Engineer (LinkedIn India)');
      const naukriIndex = html.indexOf('Senior Spring Boot Architect (Naukri)');
      const firstWwrIndex = html.indexOf('Generic Remote Developer 1');

      assert.ok(linkedInIndex < firstWwrIndex, 'LinkedIn job must appear before generic WeWorkRemotely jobs');
      assert.ok(naukriIndex < firstWwrIndex, 'Naukri job must appear before generic WeWorkRemotely jobs');
    });

    it('prioritizes JSearch LinkedIn/Naukri jobs (Tier 1) ahead of generic feed Target Companies (Tier 2) (HF-023)', () => {
      const genericTargetCompanyJob: Job = {
        id: 'wwr-target-1',
        title: 'Lead Architect',
        company: 'Microsoft',
        location: 'Remote Worldwide',
        url: 'https://weworkremotely.com/jobs/ms-1',
        tags: ['[Java]'],
        source: 'weworkremotely',
        description: 'Target company on generic remote feed',
        isTargetCompany: true
      };

      const jsearchLinkedInJob: Job = {
        id: 'jsearch-li-202',
        title: 'Full Stack Engineer (LinkedIn India)',
        company: 'Kochi Tech Ventures',
        location: 'Kochi Infopark, Kerala',
        url: 'https://in.linkedin.com/jobs/view/202',
        tags: ['[React]', '[Node.js]'],
        source: 'linkedin',
        description: 'LinkedIn domestic job',
        isTargetCompany: false
      };

      const genericRemoteJob: Job = {
        id: 'wwr-generic-3',
        title: 'Frontend Developer',
        company: 'Startup Inc',
        location: 'Remote Worldwide',
        url: 'https://weworkremotely.com/jobs/startup-3',
        tags: ['[React]'],
        source: 'weworkremotely',
        description: 'Generic remote job',
        isTargetCompany: false
      };

      // Pass generic target first, then LinkedIn, then generic remote
      const { html } = generateEmailDigestHtml(
        [genericTargetCompanyJob, jsearchLinkedInJob, genericRemoteJob],
        'Full Stack Developer Job Radar',
        '#0284c7',
        'Vishnu'
      );

      const linkedInPos = html.indexOf('Full Stack Engineer (LinkedIn India)');
      const targetPos = html.indexOf('Lead Architect');
      const genericPos = html.indexOf('Frontend Developer');

      // Tier 1 (JSearch) must appear before Tier 2 (Target company on generic feed)
      assert.ok(linkedInPos < targetPos, 'Tier 1 (JSearch / LinkedIn) must appear before Tier 2 (Target Company on generic feed)');
      // Tier 2 (Target Company) must appear before Tier 3 (Generic remote feed)
      assert.ok(targetPos < genericPos, 'Tier 2 (Target Company) must appear before Tier 3 (Generic remote feed)');
    });

    it('renders dedicated visual sections for Domestic Priority vs Global Remote (HF-027)', () => {
      const domesticJob: Job = {
        id: 'jsearch-1',
        title: 'Power Platform Developer (LinkedIn India)',
        company: 'Bangalore Tech',
        location: 'Bangalore, India',
        url: 'https://in.linkedin.com/jobs/view/1',
        tags: ['[Power Apps]'],
        source: 'linkedin',
        description: 'LinkedIn India job'
      };
      const remoteJob: Job = {
        id: 'remoteok-1',
        title: 'Full Stack Engineer (Worldwide Remote)',
        company: 'Global Inc',
        location: 'Worldwide Remote',
        url: 'https://remoteok.com/jobs/1',
        tags: ['[React]'],
        source: 'remoteok',
        description: 'Global remote job'
      };

      const { html } = generateEmailDigestHtml([domesticJob, remoteJob], 'Power Platform Job Radar', '#742774', 'Celine');

      assert.ok(html.includes('Domestic &amp; Regional Priority') || html.includes('Domestic & Regional Priority'));
      assert.ok(html.includes('Curated Global &amp; Remote') || html.includes('Curated Global & Remote'));
      assert.ok(html.includes('LinkedIn India'));
      assert.ok(html.includes('Worldwide Remote'));
    });

    it('prioritizes newest scraped jobs within the same tier (EC-014)', () => {
      const olderJob: Job = {
        id: 'jsearch-old',
        title: 'Yesterday Domestic Job',
        company: 'Old Corp',
        location: 'Pune, India',
        url: 'https://example.com/old',
        tags: ['[Java]'],
        source: 'linkedin',
        description: '',
        scrapedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      };
      const newerJob: Job = {
        id: 'jsearch-new',
        title: 'Today Domestic Job',
        company: 'Fresh Corp',
        location: 'Kochi, India',
        url: 'https://example.com/new',
        tags: ['[Java]'],
        source: 'linkedin',
        description: '',
        scrapedAt: new Date().toISOString()
      };

      const { html } = generateEmailDigestHtml([olderJob, newerJob]);
      const newPos = html.indexOf('Today Domestic Job');
      const oldPos = html.indexOf('Yesterday Domestic Job');
      assert.ok(newPos < oldPos, 'Freshest job must be displayed first within same tier');
    });

    it('caps generic remote jobs to 5 slots and allows domestic roles to fill up to 12-15 slots (EC-015)', () => {
      const domesticJobs: Job[] = Array.from({ length: 12 }, (_, i) => ({
        id: `jsearch-${i + 1}`,
        title: `Domestic Job ${i + 1}`,
        company: `Domestic Co ${i + 1}`,
        location: 'India',
        url: `https://example.com/domestic-${i + 1}`,
        tags: ['[Full Stack]'],
        source: 'linkedin',
        description: ''
      }));

      const remoteJobs: Job[] = Array.from({ length: 8 }, (_, i) => ({
        id: `remote-${i + 1}`,
        title: `Remote Job ${i + 1}`,
        company: `Remote Co ${i + 1}`,
        location: 'Worldwide Remote',
        url: `https://example.com/remote-${i + 1}`,
        tags: ['[Full Stack]'],
        source: 'remoteok',
        description: ''
      }));

      const { displayedJobs } = generateEmailDigestHtml(
        [...domesticJobs, ...remoteJobs],
        'Full Stack Developer Job Radar',
        '#0284c7',
        'Vishnu',
        15
      );

      assert.strictEqual(displayedJobs.length, 15);
      const displayedDomestic = displayedJobs.filter((j) => j.source === 'linkedin');
      const displayedRemote = displayedJobs.filter((j) => j.source === 'remoteok');

      assert.strictEqual(displayedDomestic.length, 12, 'Must display all 12 domestic jobs');
      assert.strictEqual(displayedRemote.length, 3, 'Must cap remote jobs so total is 15');
    });

    describe('[HF-029, HF-030, EC-016] Unified Single HTML Template Architecture', () => {
      it('loads unified emailDigest.html and extracts snippet components cleanly (HF-029)', async () => {
        const { loadEmailTemplate, getTemplateSnippet, renderTemplate } = await import('../src/email/templateLoader.ts');
        const masterHtml = loadEmailTemplate();
        assert.ok(masterHtml.includes('{{content}}'), 'emailDigest.html must contain {{content}} placeholder');
        assert.ok(masterHtml.includes('{{title}}'), 'emailDigest.html must contain {{title}} placeholder');

        // Verify snippet extraction
        const jobCardSnippet = getTemplateSnippet('jobCard');
        assert.ok(jobCardSnippet.includes('{{title}}'), 'jobCard snippet must contain {{title}}');
        assert.ok(jobCardSnippet.includes('{{company}}'), 'jobCard snippet must contain {{company}}');

        const sectionHeaderSnippet = getTemplateSnippet('sectionHeader');
        assert.ok(sectionHeaderSnippet.includes('{{title}}'));
        assert.ok(sectionHeaderSnippet.includes('{{badgeText}}'));

        const greetingSnippet = getTemplateSnippet('greetingCard');
        assert.ok(greetingSnippet.includes('{{displayName}}'));

        const emptyStateSnippet = getTemplateSnippet('emptyState');
        assert.ok(emptyStateSnippet.includes('{{displayName}}'));

        const overflowSnippet = getTemplateSnippet('overflowCard');
        assert.ok(overflowSnippet.includes('{{overflowCount}}'));

        const rendered = renderTemplate(masterHtml, {
          title: 'Custom Digest',
          content: '<p>Test Content</p>',
          accentColor: '#123456',
          dispatchEdition: 'Morning Dispatch',
          profileName: 'Power Platform',
          today: 'Monday, Nov 17',
          displayName: 'Celine'
        });

        assert.ok(rendered.includes('Custom Digest'));
        assert.ok(rendered.includes('<p>Test Content</p>'));
        assert.ok(!rendered.includes('{{title}}'), 'No unresolved placeholders should remain');
      });

      it('safely cleans up unmatched placeholders without syntax leakage (EC-016)', async () => {
        const { renderTemplate } = await import('../src/email/templateLoader.ts');
        const template = '<div>{{known}} and {{unknownToken}}</div>';
        const rendered = renderTemplate(template, { known: 'Value' });
        assert.strictEqual(rendered, '<div>Value and </div>', 'Unmatched placeholder must be replaced with empty string');
      });

      it('supports per-profile custom template overrides with generic fallback (HF-030)', async () => {
        const { loadEmailTemplate } = await import('../src/email/templateLoader.ts');
        const genericLayout = loadEmailTemplate('non-existent-profile');
        assert.ok(genericLayout.includes('{{content}}'));
      });

      it('embeds web portal CTA links in email greeting and overflow cards (HF-037)', () => {
        const jobs: Job[] = Array.from({ length: 20 }, (_, i) => ({
          id: `job-${i}`,
          title: `Role ${i}`,
          company: `Company ${i}`,
          location: 'Bangalore, India',
          url: `https://example.com/job-${i}`,
          tags: ['[Java]'],
          source: 'jsearch-linkedin',
          description: ''
        }));

        const { html } = generateEmailDigestHtml(jobs, 'Java Radar', '#ea580c', 'Aswin');
        assert.ok(html.includes('https://vishnu1562.github.io/Job_Bot/'), 'Must link to web portal URL');
        assert.ok(html.includes('Web Portal'), 'Must include Web Portal CTA text');
      });
    });
  });
});
