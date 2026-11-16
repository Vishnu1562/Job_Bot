import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getProfiles, extractProfileSkillTags, isJobMatchingProfile } from '../src/config/profiles.ts';
import type { RawJobListing } from '../src/types.ts';

describe('[HF-007, HF-008, HF-009, EC-004] Multi-Profile Configuration & Matching', () => {
  it('loads configured profiles and resolves recipient emails (HF-007)', () => {
    const profiles = getProfiles({ RECIPIENT_EMAIL: 'fallback@example.com' });
    assert.strictEqual(profiles.length >= 2, true);

    const powerPlatform = profiles.find((p) => p.id === 'power-platform');
    const fullStack = profiles.find((p) => p.id === 'full-stack');

    assert.ok(powerPlatform, 'Power Platform profile must be defined');
    assert.ok(fullStack, 'Full Stack profile must be defined');

    assert.strictEqual(powerPlatform?.recipientEmail, 'fallback@example.com');
    assert.strictEqual(fullStack?.recipientEmail, 'fallback@example.com');
  });

  it('matches Full Stack jobs with target technologies (HF-008)', () => {
    const profiles = getProfiles();
    const fullStack = profiles.find((p) => p.id === 'full-stack')!;

    const matchingJob: RawJobListing = {
      title: 'Full Stack Engineer (NestJS / Angular)',
      company: 'Tech Innovations',
      location: 'Bangalore, India',
      description: 'Building microservices with NestJS, Angular, and PostgreSQL database with GitHub Actions CI/CD.',
      url: 'https://example.com/job-fs-1'
    };

    assert.strictEqual(isJobMatchingProfile(matchingJob, fullStack), true);
  });

  it('correctly tags Full Stack skills without false positives on .NET (HF-009 & EC-004)', () => {
    const profiles = getProfiles();
    const fullStack = profiles.find((p) => p.id === 'full-stack')!;

    const jobTitle = 'Senior Full Stack .NET & Angular Developer';
    const jobDesc = `
      We need a strong developer with experience in .NET 8, C#, and ASP.NET Core.
      Frontend built with Angular 17.
      Databases: PostgreSQL and MSSQL Server.
      CI/CD with Azure DevOps and GitHub Enterprise.
      Also understands network protocols and internet architecture.
    `;

    const tags = extractProfileSkillTags(jobTitle, jobDesc, fullStack);

    assert.ok(tags.includes('[.NET]'), 'Should match .NET 8 / ASP.NET');
    assert.ok(tags.includes('[Angular]'), 'Should match Angular');
    assert.ok(tags.includes('[PostgreSQL]'), 'Should match PostgreSQL');
    assert.ok(tags.includes('[MSSQL]'), 'Should match MSSQL Server');
    assert.ok(tags.includes('[Azure DevOps]'), 'Should match Azure DevOps');
    assert.ok(tags.includes('[GitHub]'), 'Should match GitHub');
  });

  it('detects NestJS and tags it properly', () => {
    const profiles = getProfiles();
    const fullStack = profiles.find((p) => p.id === 'full-stack')!;

    const jobTitle = 'NestJS Backend Developer';
    const jobDesc = 'Architecting REST APIs using Nest.js framework and Postgres.';

    const tags = extractProfileSkillTags(jobTitle, jobDesc, fullStack);

    assert.ok(tags.includes('[NestJS]'));
    assert.ok(tags.includes('[PostgreSQL]'));
  });

  it('rejects unrelated jobs for Full Stack profile', () => {
    const profiles = getProfiles();
    const fullStack = profiles.find((p) => p.id === 'full-stack')!;

    const unrelatedJob: RawJobListing = {
      title: 'Senior Python Django Developer',
      company: 'Data Co',
      location: 'India',
      description: 'Python, Django, Redis, AWS.',
      url: 'https://example.com/job-py'
    };

    assert.strictEqual(isJobMatchingProfile(unrelatedJob, fullStack), false);
  });

  describe('[HF-012, HF-013, EC-006] Java & Spring Boot Profile (Resume-based)', () => {
    it('loads Java profile and resolves recipient email (HF-012)', () => {
      const profiles = getProfiles({ RECIPIENT_EMAIL: 'default@example.com' });
      const javaProfile = profiles.find((p) => p.id === 'java-backend');
      assert.ok(javaProfile, 'Java & Spring Boot profile must exist');
      assert.strictEqual(javaProfile?.recipientEmail, 'default@example.com');

      const customProfiles = getProfiles({
        RECIPIENT_EMAIL: 'default@example.com',
        RECIPIENT_EMAIL_JAVA: 'aswinmsuthan333@gmail.com'
      });
      const customJava = customProfiles.find((p) => p.id === 'java-backend');
      assert.strictEqual(customJava?.recipientEmail, 'aswinmsuthan333@gmail.com');
    });

    it('matches Java backend developer jobs (HF-013)', () => {
      const profiles = getProfiles();
      const javaProfile = profiles.find((p) => p.id === 'java-backend')!;

      const javaJob: RawJobListing = {
        title: 'Senior Java Backend Engineer (Spring Boot / Microservices)',
        company: 'Core Banking Tech',
        location: 'Kochi, India',
        description: `
          Design and develop core banking backend modules using Java, Spring Boot, and Hibernate.
          Experience with Oracle SQL, PostgreSQL, REST APIs, and Docker.
          Implement authentication using Spring Security and JWT.
        `,
        url: 'https://example.com/job-java-1'
      };

      assert.strictEqual(isJobMatchingProfile(javaJob, javaProfile), true);

      const tags = extractProfileSkillTags(javaJob.title, javaJob.description, javaProfile);
      assert.ok(tags.includes('[Java]'));
      assert.ok(tags.includes('[Spring Boot]'));
      assert.ok(tags.includes('[Hibernate/JPA]'));
      assert.ok(tags.includes('[Microservices]'));
      assert.ok(tags.includes('[REST APIs]'));
      assert.ok(tags.includes('[Oracle SQL]'));
      assert.ok(tags.includes('[PostgreSQL]'));
      assert.ok(tags.includes('[Docker]'));
      assert.ok(tags.includes('[Spring Security / JWT]'));
    });

    it('tags Python and Shell Scripting from Aswin resume (HF-017)', () => {
      const profiles = getProfiles();
      const javaProfile = profiles.find((p) => p.id === 'java-backend')!;

      const tags = extractProfileSkillTags(
        'Backend Automation Engineer',
        'Strong in Python and Shell Scripting / Bash deployment runbooks.',
        javaProfile
      );
      assert.ok(tags.includes('[Python / Shell]'));
    });

    it('does NOT false-positive match Java on pure JavaScript frontend jobs (EC-006)', () => {
      const profiles = getProfiles();
      const javaProfile = profiles.find((p) => p.id === 'java-backend')!;

      const jsJob: RawJobListing = {
        title: 'Frontend JavaScript Developer',
        company: 'Web Studio',
        location: 'India',
        description: 'JavaScript, CSS, HTML, Webpack.',
        url: 'https://example.com/job-js'
      };

      const tags = extractProfileSkillTags(jsJob.title, jsJob.description, javaProfile);
      assert.strictEqual(tags.includes('[Java]'), false, 'Should not tag pure JavaScript as Java');
    });
  });

  describe('[HF-016, NF-007] Power Platform Profile (Bhavya V - Resume-based)', () => {
    it('sets experience bounds to 3-8 years matching Bhavya 6.1 yrs profile', () => {
      const profiles = getProfiles();
      const ppProfile = profiles.find((p) => p.id === 'power-platform')!;
      assert.strictEqual(ppProfile.experience?.minYears, 3);
      assert.strictEqual(ppProfile.experience?.maxYears, 8);
    });

    it('tags SharePoint Online and M365 / PL-400 from Bhavya resume (HF-016)', () => {
      const profiles = getProfiles();
      const ppProfile = profiles.find((p) => p.id === 'power-platform')!;

      const jobDesc = `
        Enterprise Canvas Apps developer needed.
        Requires hands-on experience in SharePoint Online modernization and migration with ShareGate.
        Deep knowledge of Microsoft 365 integration, Dataverse tables, and PL-400 certification preferred.
        Experience in Copilot Studio is a plus.
      `;

      const tags = extractProfileSkillTags('Senior Power Apps Developer', jobDesc, ppProfile);
      assert.ok(tags.includes('[Canvas Apps]'));
      assert.ok(tags.includes('[Dataverse]'));
      assert.ok(tags.includes('[SharePoint Online]'));
      assert.ok(tags.includes('[M365 / PL-400]'));
      assert.ok(tags.includes('[Copilot Studio]'));
    });
  });
});
