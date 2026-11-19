import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TARGET_COMPANIES } from '../src/config/targetCompanies.ts';
import {
  parseGreenhouseJob,
  parseLeverJob,
  parseSmartRecruitersJob
} from '../src/scrapers/atsScraper.ts';
import { getProfiles } from '../src/profiles/profileRegistry.ts';

describe('[HF-054] Direct ATS API Connectors (Greenhouse, Lever, SmartRecruiters)', () => {
  const profiles = getProfiles();
  const javaProfile = profiles.find((p) => p.id === 'java-backend')!;
  const fullStackProfile = profiles.find((p) => p.id === 'full-stack')!;
  const powerProfile = profiles.find((p) => p.id === 'power-platform')!;

  describe('Target Companies Registry', () => {
    it('must contain Big 4, IBM, UST, IBS, Cognizant, and top tech companies', () => {
      const companyNames = TARGET_COMPANIES.map((c) => c.name.toLowerCase());
      const hasUst = companyNames.some((n) => n.includes('ust'));
      const hasIbs = companyNames.some((n) => n.includes('ibs'));
      const hasCognizant = companyNames.some((n) => n.includes('cognizant'));
      const hasPostman = companyNames.some((n) => n.includes('postman'));
      const hasRazorpay = companyNames.some((n) => n.includes('razorpay'));
      const hasAtlassian = companyNames.some((n) => n.includes('atlassian'));
      const hasGitlab = companyNames.some((n) => n.includes('gitlab'));
      const hasBrowserStack = companyNames.some((n) => n.includes('browserstack'));

      assert.strictEqual(hasUst, true, 'Must include UST');
      assert.strictEqual(hasIbs, true, 'Must include IBS Software');
      assert.strictEqual(hasCognizant, true, 'Must include Cognizant');
      assert.strictEqual(hasPostman, true, 'Must include Postman');
      assert.strictEqual(hasRazorpay, true, 'Must include Razorpay');
      assert.strictEqual(hasAtlassian, true, 'Must include Atlassian');
      assert.strictEqual(hasGitlab, true, 'Must include GitLab');
      assert.strictEqual(hasBrowserStack, true, 'Must include BrowserStack');
    });
  });

  describe('Greenhouse Normalizer', () => {
    it('correctly maps Greenhouse job item for India location', () => {
      const raw = {
        id: 54321,
        title: 'Full Stack Engineer (NestJS / Angular)',
        absolute_url: 'https://boards.greenhouse.io/postman/jobs/54321',
        location: { name: 'Bengaluru, India' },
        content: '<p>Looking for a Full Stack Engineer with NestJS, Angular, and PostgreSQL with 3-5 years experience.</p>',
        updated_at: '2026-11-19T08:00:00Z'
      };

      const job = parseGreenhouseJob(raw, 'Postman', fullStackProfile);
      assert.ok(job);
      assert.strictEqual(job?.title, 'Full Stack Engineer (NestJS / Angular)');
      assert.strictEqual(job?.company, 'Postman');
      assert.ok(job?.location.includes('Bengaluru') || job?.location.includes('India'));
      assert.strictEqual(job?.url, 'https://boards.greenhouse.io/postman/jobs/54321');
      assert.strictEqual(job?.source, 'postman careers');
      assert.ok(job?.tags.includes('[Angular]'));
      assert.ok(job?.tags.includes('[NestJS]'));
      assert.strictEqual(job?.isTargetCompany, true);
    });

    it('rejects Greenhouse jobs outside candidate location bounds', () => {
      const raw = {
        id: 99901,
        title: 'Full Stack Engineer',
        absolute_url: 'https://boards.greenhouse.io/postman/jobs/99901',
        location: { name: 'Austin, Texas, United States' },
        content: 'NestJS and Angular in USA',
        updated_at: '2026-11-19T08:00:00Z'
      };

      const job = parseGreenhouseJob(raw, 'Postman', fullStackProfile);
      assert.strictEqual(job, null, 'Must reject US-only role');
    });
  });

  describe('Lever Normalizer', () => {
    it('correctly maps Lever job item with remote / India categories', () => {
      const raw = {
        id: 'lever-abc-123',
        text: 'Senior Java Backend Engineer',
        hostedUrl: 'https://jobs.lever.co/razorpay/lever-abc-123',
        categories: {
          location: 'Bengaluru, Karnataka, India',
          team: 'Core Platform Engineering',
          commitment: 'Full-time'
        },
        descriptionPlain: 'Core Java, Spring Boot, Microservices, Oracle SQL, and Docker with 4+ years experience.',
        createdAt: 1731900000000
      };

      const job = parseLeverJob(raw, 'Razorpay', javaProfile);
      assert.ok(job);
      assert.strictEqual(job?.title, 'Senior Java Backend Engineer');
      assert.strictEqual(job?.company, 'Razorpay');
      assert.ok(job?.location.includes('Bengaluru') || job?.location.includes('India'));
      assert.strictEqual(job?.url, 'https://jobs.lever.co/razorpay/lever-abc-123');
      assert.strictEqual(job?.source, 'razorpay careers');
      assert.ok(job?.tags.includes('[Java]'));
      assert.ok(job?.tags.includes('[Spring Boot]'));
      assert.strictEqual(job?.isTargetCompany, true);
    });
  });

  describe('SmartRecruiters Normalizer', () => {
    it('correctly maps SmartRecruiters job item for UST / enterprise IT', () => {
      const raw = {
        id: 'sr-ust-777',
        name: 'Power Platform & Canvas Apps Consultant',
        company: { name: 'UST' },
        location: {
          city: 'Kochi',
          region: 'Kerala',
          country: 'in',
          remote: true
        },
        refNumber: 'REF123456',
        releasedDate: '2026-11-19T05:00:00.000Z',
        jobAd: {
          sections: {
            jobDescription: {
              text: 'Design Power Apps Canvas Apps, Power Automate flows, and Dataverse components for global clients.'
            }
          }
        }
      };

      const job = parseSmartRecruitersJob(raw, 'UST', powerProfile);
      assert.ok(job);
      assert.strictEqual(job?.title, 'Power Platform & Canvas Apps Consultant');
      assert.strictEqual(job?.company, 'UST');
      assert.ok(job?.location.includes('Kochi') || job?.location.includes('India'));
      assert.strictEqual(job?.url, 'https://jobs.smartrecruiters.com/UST/sr-ust-777');
      assert.strictEqual(job?.source, 'ust careers');
      assert.ok(job?.tags.includes('[Canvas Apps]'));
      assert.ok(job?.tags.includes('[Power Automate]'));
      assert.strictEqual(job?.isTargetCompany, true);
    });
  });
});
