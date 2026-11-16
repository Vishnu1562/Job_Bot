import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isPowerPlatformJob,
  isIndiaLocation,
  containsNegativeKeywords,
  normalizeUrl,
  validateJob,
  isCompanyExcluded,
  isTargetCompany
} from '../src/filter.ts';
import { getProfiles } from '../src/config/profiles.ts';
import type { RawJobListing } from '../src/types.ts';

describe('Job Filters & Normalization', () => {
  describe('[HF-001 & VR-001] isPowerPlatformJob & validateJob', () => {
    it('accepts relevant Power Platform roles', () => {
      const job: RawJobListing = {
        title: 'Senior Power Apps & Power Automate Developer',
        company: 'Cloud Corp',
        location: 'India',
        description: 'Building custom Canvas Apps, Dataverse solutions, and Power Automate cloud flows.',
        url: 'https://example.com/job1'
      };
      assert.strictEqual(validateJob(job), true);
      assert.strictEqual(isPowerPlatformJob(job), true);
    });

    it('rejects jobs missing title or url (VR-001)', () => {
      const invalidJob = {
        title: '',
        company: 'Acme',
        location: 'India',
        description: 'Power Platform',
        url: ''
      } as RawJobListing;
      assert.strictEqual(validateJob(invalidJob), false);
    });

    it('rejects non-Power Platform IT jobs', () => {
      const job: RawJobListing = {
        title: 'Senior Java Backend Engineer',
        company: 'JavaSoft',
        location: 'Bangalore, India',
        description: 'Spring Boot, Microservices, PostgreSQL.',
        url: 'https://example.com/job2'
      };
      assert.strictEqual(isPowerPlatformJob(job), false);
    });
  });

  describe('[EC-001] isIndiaLocation', () => {
    it('matches Indian cities, IT parks, and country identifiers', () => {
      assert.strictEqual(isIndiaLocation('India'), true);
      assert.strictEqual(isIndiaLocation('Bangalore, Karnataka'), true);
      assert.strictEqual(isIndiaLocation('Bengaluru'), true);
      assert.strictEqual(isIndiaLocation('Whitefield, Bangalore'), true);
      assert.strictEqual(isIndiaLocation('Electronic City, Bengaluru'), true);
      assert.strictEqual(isIndiaLocation('Manyata Tech Park'), true);
      assert.strictEqual(isIndiaLocation('Hyderabad, Telangana'), true);
      assert.strictEqual(isIndiaLocation('HITEC City, Hyderabad'), true);
      assert.strictEqual(isIndiaLocation('Cyberabad / Gachibowli'), true);
      assert.strictEqual(isIndiaLocation('Pune / Hybrid'), true);
      assert.strictEqual(isIndiaLocation('Hinjawadi, Pune'), true);
      assert.strictEqual(isIndiaLocation('Magarpatta City, Pune'), true);
      assert.strictEqual(isIndiaLocation('Kochi, Kerala'), true);
      assert.strictEqual(isIndiaLocation('Infopark Kochi'), true);
      assert.strictEqual(isIndiaLocation('Technopark, Trivandrum'), true);
      assert.strictEqual(isIndiaLocation('Thiruvananthapuram, Kerala'), true);
      assert.strictEqual(isIndiaLocation('Chennai, Tamil Nadu'), true);
      assert.strictEqual(isIndiaLocation('OMR, Chennai'), true);
      assert.strictEqual(isIndiaLocation('Tidel Park, Coimbatore'), true);
      assert.strictEqual(isIndiaLocation('Gurgaon / Gurugram'), true);
      assert.strictEqual(isIndiaLocation('Noida, UP'), true);
      assert.strictEqual(isIndiaLocation('Delhi NCR'), true);
      assert.strictEqual(isIndiaLocation('Mumbai, Maharashtra'), true);
      assert.strictEqual(isIndiaLocation('Navi Mumbai'), true);
      assert.strictEqual(isIndiaLocation('Kolkata, Sector V'), true);
      assert.strictEqual(isIndiaLocation('GIFT City, Ahmedabad'), true);
      assert.strictEqual(isIndiaLocation('Remote - India'), true);
      assert.strictEqual(isIndiaLocation('Remote (Worldwide)'), true);
      assert.strictEqual(isIndiaLocation('Anywhere'), true);
    });

    it('rejects exclusive non-India regions', () => {
      assert.strictEqual(isIndiaLocation('USA Only'), false);
      assert.strictEqual(isIndiaLocation('Remote - US / Canada only'), false);
      assert.strictEqual(isIndiaLocation('London, UK'), false);
      assert.strictEqual(isIndiaLocation('Berlin, Germany'), false);
    });
  });

  describe('[NF-001] containsNegativeKeywords', () => {
    it('detects unpaid internships and data entry spam', () => {
      const spamJob: RawJobListing = {
        title: 'Unpaid Intern - Excel Data Entry',
        company: 'SpamCorp',
        location: 'India',
        description: 'Excel-only copy paste tasks. Unpaid internship.',
        url: 'https://example.com/spam'
      };
      assert.strictEqual(containsNegativeKeywords(spamJob), true);
    });

    it('passes legitimate tech roles', () => {
      const legitJob: RawJobListing = {
        title: 'Power Platform Solutions Architect',
        company: 'TechGlobal',
        location: 'Remote - India',
        description: 'Design enterprise architecture with Dataverse, Model-Driven Apps, and PCF.',
        url: 'https://example.com/legit'
      };
      assert.strictEqual(containsNegativeKeywords(legitJob), false);
    });
  });

  describe('[EC-003] normalizeUrl', () => {
    it('strips tracking query parameters (utm_source, ref, etc.)', () => {
      const dirtyUrl = 'https://jobs.example.com/view/12345?utm_source=feed&ref=jobicy&source=rss';
      const cleanUrl = normalizeUrl(dirtyUrl);
      assert.strictEqual(cleanUrl, 'https://jobs.example.com/view/12345');
    });
  });

  describe('[NF-008 & EC-008] Per-Profile Company Exclusions', () => {
    const profiles = getProfiles();
    const powerPlatform = profiles.find((p) => p.id === 'power-platform')!;
    const javaBackend = profiles.find((p) => p.id === 'java-backend')!;
    const fullStack = profiles.find((p) => p.id === 'full-stack')!;

    it('excludes Wipro for Celine (Power Platform) (NF-008)', () => {
      assert.strictEqual(isCompanyExcluded('Wipro', powerPlatform), true);
      assert.strictEqual(isCompanyExcluded('Wipro Technologies', powerPlatform), true);
      assert.strictEqual(isCompanyExcluded('Wipro Limited', powerPlatform), true);
      assert.strictEqual(isCompanyExcluded('Infosys', powerPlatform), false);
    });

    it('excludes TCS for Aswin (Java) (NF-008 & EC-008)', () => {
      assert.strictEqual(isCompanyExcluded('TCS', javaBackend), true);
      assert.strictEqual(isCompanyExcluded('Tata Consultancy Services', javaBackend), true);
      assert.strictEqual(isCompanyExcluded('TCS Digital', javaBackend), true);
      assert.strictEqual(isCompanyExcluded('Tata Elxsi', javaBackend), false);
      assert.strictEqual(isCompanyExcluded('UST Global', javaBackend), false);
    });

    it('excludes EY for Vishnu (Full Stack) (NF-008 & EC-008)', () => {
      assert.strictEqual(isCompanyExcluded('EY', fullStack), true);
      assert.strictEqual(isCompanyExcluded('Ernst & Young', fullStack), true);
      assert.strictEqual(isCompanyExcluded('Ernst and Young GDS', fullStack), true);
      assert.strictEqual(isCompanyExcluded('EY Global Delivery Services', fullStack), true);
      // Word boundary safety: do not exclude non-EY words containing "ey"
      assert.strictEqual(isCompanyExcluded('Honeywell', fullStack), false);
      assert.strictEqual(isCompanyExcluded('Journey Technologies', fullStack), false);
      assert.strictEqual(isCompanyExcluded('Microsoft', fullStack), false);
    });
  });

  describe('[HF-019] Target Companies (Global Tech + Kochi Infopark)', () => {
    const profiles = getProfiles();
    const javaBackend = profiles.find((p) => p.id === 'java-backend')!;

    it('identifies global tech giants as target companies', () => {
      assert.strictEqual(isTargetCompany('Microsoft', javaBackend), true);
      assert.strictEqual(isTargetCompany('Google', javaBackend), true);
      assert.strictEqual(isTargetCompany('Amazon', javaBackend), true);
      assert.strictEqual(isTargetCompany('Oracle', javaBackend), true);
      assert.strictEqual(isTargetCompany('Accenture', javaBackend), true);
      assert.strictEqual(isTargetCompany('Infosys', javaBackend), true);
    });

    it('identifies Kochi Infopark tech companies as target companies', () => {
      assert.strictEqual(isTargetCompany('UST', javaBackend), true);
      assert.strictEqual(isTargetCompany('UST Global', javaBackend), true);
      assert.strictEqual(isTargetCompany('IBS Software', javaBackend), true);
      assert.strictEqual(isTargetCompany('QBurst', javaBackend), true);
      assert.strictEqual(isTargetCompany('Tata Elxsi', javaBackend), true);
      assert.strictEqual(isTargetCompany('Experion Technologies', javaBackend), true);
      assert.strictEqual(isTargetCompany('Fingent', javaBackend), true);
      assert.strictEqual(isTargetCompany('NeST Digital', javaBackend), true);
      assert.strictEqual(isTargetCompany('KeyValue Software Systems', javaBackend), true);
    });

    it('returns false for generic unknown companies', () => {
      assert.strictEqual(isTargetCompany('Unknown Startup Ltd', javaBackend), false);
      assert.strictEqual(isTargetCompany('Random Agency 123', javaBackend), false);
    });
  });
});
