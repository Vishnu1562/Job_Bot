import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateEmailDigestHtml } from '../src/emailTemplate.ts';
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

      const { html, text } = generateEmailDigestHtml(jobs, 'Full Stack Developer Job Radar', '#0284c7', 'Vishnu');

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
  });
});
