import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseRemotiveJob,
  parseJobicyJob,
  parseArbeitnowJob,
  parseRemoteOkJob,
  parseRssItem,
  parseJSearchJob,
  parseAdzunaJob
} from '../src/scrapers/scraperCoordinator.ts';
import { getProfiles } from '../src/profiles/profileRegistry.ts';

describe('[HF-001] Scraper Normalizers & Parsers', () => {
  it('correctly maps Remotive job structure', () => {
    const raw = {
      id: 9991,
      title: 'Senior Power Apps Developer',
      company_name: 'Microsoft Partner Inc',
      candidate_required_location: 'India / Worldwide Remote',
      url: 'https://remotive.com/remote-jobs/power-apps-9991?utm_source=feed',
      description: 'Building canvas apps and Dataverse components.'
    };

    const job = parseRemotiveJob(raw);
    assert.ok(job);
    assert.strictEqual(job?.title, 'Senior Power Apps Developer');
    assert.strictEqual(job?.company, 'Microsoft Partner Inc');
    assert.strictEqual(job?.location, 'India / Worldwide Remote');
    assert.strictEqual(job?.url, 'https://remotive.com/remote-jobs/power-apps-9991');
    assert.strictEqual(job?.source, 'remotive');
    assert.ok(job?.tags.includes('[Canvas Apps]'));
    assert.ok(job?.tags.includes('[Dataverse]'));
  });

  it('correctly maps Jobicy job structure', () => {
    const raw = {
      id: 8882,
      jobTitle: 'Power Automate & RPA Specialist',
      companyName: 'Automation World',
      jobGeo: 'Bengaluru, India',
      url: 'https://jobicy.com/jobs/8882?ref=jobicy',
      jobDescription: 'Build Power Automate cloud and desktop flows.'
    };

    const job = parseJobicyJob(raw);
    assert.ok(job);
    assert.strictEqual(job?.title, 'Power Automate & RPA Specialist');
    assert.strictEqual(job?.company, 'Automation World');
    assert.strictEqual(job?.location, 'Bengaluru, India');
    assert.strictEqual(job?.url, 'https://jobicy.com/jobs/8882');
    assert.strictEqual(job?.source, 'jobicy');
    assert.ok(job?.tags.includes('[Power Automate]'));
  });

  it('correctly maps Arbeitnow job structure', () => {
    const raw = {
      slug: 'dynamics-365-consultant-123',
      title: 'Dynamics 365 / Dataverse Consultant',
      company_name: 'Enterprise Consulting',
      location: 'Hyderabad, India',
      url: 'https://www.arbeitnow.com/view/dynamics-365-consultant-123',
      description: 'Dynamics 365 CRM and Power Apps solutions.'
    };

    const job = parseArbeitnowJob(raw);
    assert.ok(job);
    assert.strictEqual(job?.title, 'Dynamics 365 / Dataverse Consultant');
    assert.strictEqual(job?.company, 'Enterprise Consulting');
    assert.strictEqual(job?.location, 'Hyderabad, India');
    assert.ok(job?.tags.includes('[Dynamics 365]'));
    assert.ok(job?.tags.includes('[Dataverse]'));
  });

  it('correctly maps RSS item structure', () => {
    const raw = {
      title: 'TechCorp: Power Platform & PCF Developer',
      link: 'https://weworkremotely.com/jobs/pcf-dev-123',
      description: 'Location: Remote Worldwide. Seeking developer to create PCF controls.',
      pubDate: 'Mon, 16 Nov 2026 08:00:00 GMT'
    };

    const job = parseRssItem(raw, 'weworkremotely');
    assert.ok(job);
    assert.strictEqual(job?.company, 'TechCorp');
    assert.strictEqual(job?.title, 'Power Platform & PCF Developer');
    assert.strictEqual(job?.url, 'https://weworkremotely.com/jobs/pcf-dev-123');
    assert.ok(job?.tags.includes('[PCF]'));
  });

  it('correctly maps RemoteOK job structure (HF-020)', () => {
    const raw = {
      id: '123456',
      position: 'Senior Power Apps Engineer',
      company: 'Remote Inc',
      location: 'Worldwide Remote',
      url: 'https://remoteok.com/remote-jobs/123456?ref=remoteok',
      apply_url: 'https://remoteok.com/remote-jobs/123456',
      tags: ['powerapps', 'canvas apps'],
      description: 'Power Platform and Canvas Apps development with Dataverse.',
      date: '2026-11-16T12:00:00Z'
    };

    const job = parseRemoteOkJob(raw);
    assert.ok(job);
    assert.strictEqual(job?.title, 'Senior Power Apps Engineer');
    assert.strictEqual(job?.company, 'Remote Inc');
    assert.strictEqual(job?.location, 'Worldwide Remote');
    assert.strictEqual(job?.url, 'https://remoteok.com/remote-jobs/123456');
    assert.strictEqual(job?.source, 'remoteok');
  });

  it('safely handles RemoteOK disclaimer/legal object (HF-020)', () => {
    const legalNotice = {
      legal: 'Please do not scrape without user-agent',
      id: null,
      position: null
    };
    assert.strictEqual(parseRemoteOkJob(legalNotice), null);
    assert.strictEqual(parseRemoteOkJob(null), null);
  });

  it('rejects listings that do not match location or are spam', () => {
    const nonIndia = {
      id: 111,
      title: 'Power Apps Developer',
      company_name: 'US Corp',
      candidate_required_location: 'USA Only',
      url: 'https://example.com/job1',
      description: 'Power Apps'
    };
    assert.strictEqual(parseRemotiveJob(nonIndia), null);

    const spam = {
      id: 222,
      title: 'Unpaid Data Entry Intern',
      company_name: 'Spam Co',
      candidate_required_location: 'India',
      url: 'https://example.com/job2',
      description: 'Unpaid typing'
    };
    assert.strictEqual(parseRemotiveJob(spam), null);
  });

  describe('[HF-022] Indian IT Hubs Aggregator via JSearch & Adzuna (LinkedIn, Naukri, Indeed)', () => {
    const profiles = getProfiles();
    const javaProfile = profiles.find((p) => p.id === 'java-backend')!;
    const fullStackProfile = profiles.find((p) => p.id === 'full-stack')!;

    it('correctly maps JSearch LinkedIn / Naukri job item with Indian IT park location', () => {
      const rawJSearch = {
        job_id: 'jsearch-123',
        job_title: 'Java Spring Boot Developer',
        employer_name: 'Cognizant',
        job_city: 'Kochi',
        job_state: 'Kerala',
        job_country: 'IN',
        job_is_remote: false,
        job_apply_link: 'https://in.linkedin.com/jobs/view/123456?utm_source=jsearch',
        job_publisher: 'LinkedIn',
        job_description: 'Looking for a 3-5 years Java & Spring Boot engineer at Infopark Kochi with PostgreSQL and Microservices.',
        job_posted_at_datetime_utc: '2026-11-16T10:00:00.000Z'
      };

      const job = parseJSearchJob(rawJSearch, javaProfile);
      assert.ok(job);
      assert.strictEqual(job?.title, 'Java Spring Boot Developer');
      assert.strictEqual(job?.company, 'Cognizant');
      assert.ok(job?.location.includes('Kochi'));
      assert.strictEqual(job?.url, 'https://in.linkedin.com/jobs/view/123456');
      assert.strictEqual(job?.source, 'linkedin');
      assert.ok(job?.tags.includes('[Java]'));
      assert.ok(job?.tags.includes('[Spring Boot]'));
      assert.strictEqual(job?.isTargetCompany, true, 'Cognizant is target company');
    });

    it('correctly maps Adzuna India job item', () => {
      const rawAdzuna = {
        id: 'adzuna-999',
        title: 'Full Stack Engineer (Angular / NestJS)',
        company: { display_name: 'UST Global' },
        location: { display_name: 'Whitefield, Bengaluru, Karnataka' },
        redirect_url: 'https://www.adzuna.in/land/ad/adzuna-999?utm_medium=api',
        description: 'Design web apps using NestJS, Angular, and PostgreSQL with Azure DevOps.',
        created: '2026-11-16T08:00:00Z'
      };

      const job = parseAdzunaJob(rawAdzuna, fullStackProfile);
      assert.ok(job);
      assert.strictEqual(job?.title, 'Full Stack Engineer (Angular / NestJS)');
      assert.strictEqual(job?.company, 'UST Global');
      assert.ok(job?.location.includes('Bengaluru') || job?.location.includes('Whitefield'));
      assert.strictEqual(job?.source, 'adzuna');
      assert.ok(job?.tags.includes('[Angular]'));
      assert.ok(job?.tags.includes('[NestJS]'));
      assert.strictEqual(job?.isTargetCompany, true, 'UST Global is target company');
    });
  });

  describe('[REG-004] Centralized API Endpoints & Feeds Registry', () => {
    it('verifies all API and RSS endpoints are defined and are valid HTTPS URLs', async () => {
      const { API_ENDPOINTS, RSS_FEEDS } = await import('../src/constants/apiEndpoints.ts');

      assert.ok(API_ENDPOINTS.JSEARCH.startsWith('https://'));
      assert.ok(API_ENDPOINTS.ADZUNA_INDIA.startsWith('https://'));
      assert.ok(API_ENDPOINTS.REMOTIVE.startsWith('https://'));
      assert.ok(API_ENDPOINTS.JOBICY.startsWith('https://'));
      assert.ok(API_ENDPOINTS.ARBEITNOW.startsWith('https://'));
      assert.ok(API_ENDPOINTS.REMOTEOK.startsWith('https://'));

      assert.ok(RSS_FEEDS.length >= 6);
      for (const feed of RSS_FEEDS) {
        assert.ok(feed.url.startsWith('https://'), `Feed URL must be https: ${feed.url}`);
        assert.ok(feed.source && feed.source.length > 0, `Feed must have source: ${feed.source}`);
      }
    });
  });
});
