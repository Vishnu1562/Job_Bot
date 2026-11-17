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

  describe('[HF-024 & RR-002] Multi-Version JSearch Endpoint Auto-Fallback & Shape Normalization', () => {
    const profiles = getProfiles();
    const powerProfile = profiles.find((p) => p.id === 'power-platform')!;

    it('correctly maps JSearch v5 shape with alternate field names', () => {
      const v5Raw = {
        id: 'v5-role-777',
        title: 'Power Apps & Power Automate Consultant',
        company_name: 'Microsoft',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'IN',
        remote: false,
        apply_link: 'https://careers.microsoft.com/jobs/v5-role-777?ref=rapidapi',
        publisher: 'Naukri',
        description: 'Design Power Platform, Dataverse, Canvas Apps, and Power Automate flows for 4-6 years experienced professionals.'
      };

      const job = parseJSearchJob(v5Raw, powerProfile);
      assert.ok(job, 'Must successfully parse v5 job structure');
      assert.strictEqual(job?.title, 'Power Apps & Power Automate Consultant');
      assert.strictEqual(job?.company, 'Microsoft');
      assert.ok(job?.location.includes('Hyderabad'));
      assert.strictEqual(job?.url, 'https://careers.microsoft.com/jobs/v5-role-777');
      assert.strictEqual(job?.source, 'naukri');
      assert.strictEqual(job?.isTargetCompany, true, 'Microsoft is target company');
    });

    it('recovers via auto-fallback when primary endpoint returns 404 does not exist', async () => {
      const { fetchJSearchJobs, setResolvedJSearchEndpoint, getResolvedJSearchEndpoint } = await import(
        '../src/scrapers/jsearchScraper.ts'
      );

      // Reset cache
      setResolvedJSearchEndpoint(null);

      const originalFetch = globalThis.fetch;
      const requestedUrls: string[] = [];

      // Mock global fetch to simulate 404 on /job-search, then 200 on /search
      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = input.toString();
        requestedUrls.push(urlStr);

        if (urlStr.includes('/job-search')) {
          return new Response(JSON.stringify({ message: "Endpoint '/job-search' does not exist" }), {
            status: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (urlStr.includes('/search')) {
          return new Response(
            JSON.stringify({
              status: 'OK',
              data: [
                {
                  job_id: 'auto-fallback-1',
                  job_title: 'Senior Power Apps Developer',
                  employer_name: 'Wipro Technologies', // note: excluded company for Celine
                  job_city: 'Bengaluru',
                  job_country: 'IN',
                  job_apply_link: 'https://example.com/job1',
                  job_description: 'Power Apps and Dataverse 4 years exp'
                },
                {
                  job_id: 'auto-fallback-2',
                  job_title: 'Power Platform Developer',
                  employer_name: 'Infosys',
                  job_city: 'Kochi',
                  job_country: 'IN',
                  job_apply_link: 'https://example.com/job2',
                  job_description: 'Power Apps, Dataverse, SharePoint Online 4 years exp'
                }
              ]
            }),
            {
              status: 200,
              statusText: 'OK',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        return new Response('Not found', { status: 404 });
      };

      try {
        process.env.RAPIDAPI_KEY = 'test_key_12345';
        const collected: any[] = [];
        await fetchJSearchJobs(powerProfile, (job) => {
          if (job) collected.push(job);
        });

        // Verify fallback attempted candidate endpoints
        assert.ok(requestedUrls.some((u) => u.includes('/job-search') || u.includes('/search')));
        // Verify job collection succeeded (Infosys accepted, Wipro excluded across 2 queries)
        assert.strictEqual(collected.length, 2);
        assert.strictEqual(collected[0].company, 'Infosys');
        // Verify working endpoint was cached
        assert.strictEqual(getResolvedJSearchEndpoint(), 'https://jsearch.p.rapidapi.com/search');
      } finally {
        globalThis.fetch = originalFetch;
        delete process.env.RAPIDAPI_KEY;
        setResolvedJSearchEndpoint(null);
      }
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
