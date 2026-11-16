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

    const { subject, html } = generateEmailDigestHtml(jobs);

    assert.ok(subject.includes('1 New Roles Found Today') || subject.includes('1 New Role'));
    assert.ok(html.includes('Lead Power Platform Architect'));
    assert.ok(html.includes('Infosys'));
    assert.ok(html.includes('Hyderabad, India'));
    assert.ok(html.includes('[Canvas Apps]'));
    assert.ok(html.includes('[Dataverse]'));
    assert.ok(html.includes('[PCF]'));
    assert.ok(html.includes('Apply Now'));
    assert.ok(html.includes('https://example.com/apply-infosys'));
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
      const { html } = generateEmailDigestHtml([sampleJob], 'Power Platform Job Radar', '#742774', 'Bhavya');
      assert.ok(!html.includes('running 24/7 on GitHub Actions'), 'Should not contain GitHub Actions bot text');
      assert.ok(!html.includes('Tracked via SQLite'), 'Should not contain SQLite tracking text');
      assert.ok(!html.includes('Zero Server Costs'), 'Should not contain Zero Server Costs text');
      assert.ok(html.includes('Curated with care'));
      assert.ok(html.includes('Bhavya'));
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
  });
});
