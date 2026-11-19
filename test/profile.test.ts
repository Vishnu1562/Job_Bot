import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getProfiles, extractProfileSkillTags, isJobMatchingProfile } from '../src/profiles/profileRegistry.ts';
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
      assert.strictEqual(customJava?.recipientEmail, 'default@example.com, aswinmsuthan333@gmail.com');
    });

    it('resolves dual recipients for Power Platform and Full Stack profiles (HF-025)', () => {
      const customProfiles = getProfiles({
        RECIPIENT_EMAIL: 'admin@company.com',
        RECIPIENT_EMAIL_POWERPLATFORM: 'celine@company.com',
        RECIPIENT_EMAIL_FULLSTACK: 'vishnu@company.com'
      });

      const pp = customProfiles.find((p) => p.id === 'power-platform');
      const fs = customProfiles.find((p) => p.id === 'full-stack');

      assert.strictEqual(pp?.recipientEmail, 'admin@company.com, celine@company.com');
      assert.strictEqual(fs?.recipientEmail, 'admin@company.com, vishnu@company.com');
    });

    it('gracefully falls back to default recipient when profile recipient is missing or empty (HF-026)', () => {
      const customProfiles = getProfiles({
        RECIPIENT_EMAIL: 'admin@company.com',
        RECIPIENT_EMAIL_POWERPLATFORM: '',
        RECIPIENT_EMAIL_FULLSTACK: '   '
      });

      const pp = customProfiles.find((p) => p.id === 'power-platform');
      const fs = customProfiles.find((p) => p.id === 'full-stack');
      const java = customProfiles.find((p) => p.id === 'java-backend');

      assert.strictEqual(pp?.recipientEmail, 'admin@company.com');
      assert.strictEqual(fs?.recipientEmail, 'admin@company.com');
      assert.strictEqual(java?.recipientEmail, 'admin@company.com');
    });

    it('deduplicates case-insensitively when profile recipient matches default recipient (EC-013)', () => {
      const customProfiles = getProfiles({
        RECIPIENT_EMAIL: 'admin@company.com',
        RECIPIENT_EMAIL_POWERPLATFORM: 'ADMIN@COMPANY.COM',
        RECIPIENT_EMAIL_FULLSTACK: ' admin@company.com '
      });

      const pp = customProfiles.find((p) => p.id === 'power-platform');
      const fs = customProfiles.find((p) => p.id === 'full-stack');

      assert.strictEqual(pp?.recipientEmail, 'admin@company.com');
      assert.strictEqual(fs?.recipientEmail, 'admin@company.com');
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

    it('rejects conflicting tech stack titles like Magento, PHP, WordPress, and Shopify (NF-009)', () => {
      const profiles = getProfiles();
      const javaProfile = profiles.find((p) => p.id === 'java-backend')!;

      // Simulates Lemon.io "Senior Magento Developer" from user screenshot where body mentions Java/Python
      const magentoJob: RawJobListing = {
        title: 'Senior Magento Developer',
        company: 'Lemon.io',
        location: 'Remote Worldwide',
        description: 'We need a Magento developer. Experience with PHP, Java, React, Python is a plus.',
        url: 'https://example.com/job-magento'
      };
      assert.strictEqual(isJobMatchingProfile(magentoJob, javaProfile), false, 'Magento Developer must be rejected for Java');

      const phpJob: RawJobListing = {
        title: 'PHP / Laravel Backend Developer',
        company: 'Web Solutions',
        location: 'India',
        description: 'Build web applications in PHP with Laravel. Microservices and Java background welcome.',
        url: 'https://example.com/job-php'
      };
      assert.strictEqual(isJobMatchingProfile(phpJob, javaProfile), false, 'PHP Developer must be rejected for Java');

      const wpJob: RawJobListing = {
        title: 'Senior WordPress Developer',
        company: 'CMS Agency',
        location: 'India',
        description: 'Custom themes, plugins, REST APIs, and Java integrations.',
        url: 'https://example.com/job-wp'
      };
      assert.strictEqual(isJobMatchingProfile(wpJob, javaProfile), false, 'WordPress Developer must be rejected for Java');

      const shopifyJob: RawJobListing = {
        title: 'Shopify App Developer',
        company: 'Ecom Store',
        location: 'India',
        description: 'Shopify Liquid, APIs, Java backend webhook endpoints.',
        url: 'https://example.com/job-shopify'
      };
      assert.strictEqual(isJobMatchingProfile(shopifyJob, javaProfile), false, 'Shopify Developer must be rejected for Java');
    });
  });

  describe('[NF-009] Full Stack Conflicting Tech Stack Title Exclusion', () => {
    it('rejects Magento, WordPress, and Shopify jobs for Full Stack profile', () => {
      const profiles = getProfiles();
      const fullStack = profiles.find((p) => p.id === 'full-stack')!;

      const magentoJob: RawJobListing = {
        title: 'Senior Magento Developer',
        company: 'Agency',
        location: 'India',
        description: 'Full stack Magento with Angular frontend and backend modules.',
        url: 'https://example.com/fs-magento'
      };
      assert.strictEqual(isJobMatchingProfile(magentoJob, fullStack), false);

      const wpJob: RawJobListing = {
        title: 'WordPress Theme Developer',
        company: 'Media House',
        location: 'India',
        description: 'Full stack WordPress and PHP developer with Postgres.',
        url: 'https://example.com/fs-wp'
      };
      assert.strictEqual(isJobMatchingProfile(wpJob, fullStack), false);
    });
  });

  describe('[HF-016, NF-007] Power Platform Profile (Celine - Resume-based)', () => {
    it('sets experience bounds to 3-8 years matching Celine 6.1 yrs profile', () => {
      const profiles = getProfiles();
      const ppProfile = profiles.find((p) => p.id === 'power-platform')!;
      assert.strictEqual(ppProfile.experience?.minYears, 3);
      assert.strictEqual(ppProfile.experience?.maxYears, 8);
    });

    it('tags SharePoint Online and M365 / PL-400 from Celine resume (HF-016)', () => {
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

  describe('[HF-059] PL/SQL Developer Search Profile (Minnu - Resume-based)', () => {
    it('loads PL/SQL profile, resolves candidate name as Minnu, and uses secrets without hardcoded email', () => {
      const profiles = getProfiles({ RECIPIENT_EMAIL: 'default@test.com' });
      const plsql = profiles.find((p) => p.id === 'plsql-developer');
      assert.ok(plsql, 'PL/SQL profile must be registered');
      assert.strictEqual(plsql.candidateName, 'Minnu');
      assert.strictEqual(plsql.name, 'PL/SQL Developer Job Radar');
      assert.strictEqual(plsql.recipientEmail, 'default@test.com');
      assert.strictEqual(plsql.recipientEmail.includes('dilshadashabnam'), false, 'Must NOT contain hardcoded resume email');

      const customProfiles = getProfiles({
        RECIPIENT_EMAIL: 'default@test.com',
        RECIPIENT_EMAIL_PLSQL: 'secret-minnu@test.com'
      });
      const customPlsql = customProfiles.find((p) => p.id === 'plsql-developer');
      assert.strictEqual(customPlsql?.recipientEmail, 'default@test.com, secret-minnu@test.com');
    });

    it('does not contain hardcoded default email fallbacks in any profile', () => {
      const profiles = getProfiles({});
      for (const p of profiles) {
        assert.strictEqual(p.recipientEmail, '', `Profile ${p.id} must have empty recipient when no secret is passed`);
      }
    });

    it('sets experience bounds to 2-6 years matching 4-yr profile and excludes Cognizant', () => {
      const profiles = getProfiles();
      const plsql = profiles.find((p) => p.id === 'plsql-developer')!;
      assert.strictEqual(plsql.experience?.minYears, 2);
      assert.strictEqual(plsql.experience?.maxYears, 6);
      assert.ok(plsql.excludedCompanies.some(r => r.test('Cognizant') || r.test('CTS')), 'Must exclude current employer Cognizant');
    });

    it('matches PL/SQL and Oracle Developer jobs and tags resume skills', () => {
      const profiles = getProfiles();
      const plsql = profiles.find((p) => p.id === 'plsql-developer')!;

      const job: RawJobListing = {
        title: 'Senior PL/SQL Developer (Oracle ADF)',
        company: 'Infosys',
        location: 'Kochi, Kerala',
        description: 'Requires strong experience in Oracle PL/SQL, stored procedures, packages, triggers, Oracle ADF with JDeveloper, Java backing beans, and Power BI reporting.',
        url: 'https://example.com/job-plsql-1'
      };

      assert.strictEqual(isJobMatchingProfile(job, plsql), true);

      const tags = extractProfileSkillTags(job.title, job.description, plsql);
      assert.ok(tags.includes('[PL/SQL]'));
      assert.ok(tags.includes('[Oracle SQL]'));
      assert.ok(tags.includes('[Oracle ADF]'));
      assert.ok(tags.includes('[Power BI]'));
      assert.ok(tags.includes('[Java]'));
    });

    it('rejects conflicting tech stack titles for PL/SQL profile', () => {
      const profiles = getProfiles();
      const plsql = profiles.find((p) => p.id === 'plsql-developer')!;

      const mobileJob: RawJobListing = {
        title: 'Senior iOS & Flutter Developer',
        company: 'AppCo',
        location: 'Bangalore',
        description: 'Requires Swift, Flutter, and some Oracle database queries.',
        url: 'https://example.com/job-ios'
      };

      assert.strictEqual(isJobMatchingProfile(mobileJob, plsql), false);
    });
  });

  describe('[REG-003] Modular Domain Architecture Subfile Isolation', () => {
    it('allows independent import and customization of individual profiles from subfiles', async () => {
      const { getPowerPlatformProfile } = await import('../src/profiles/powerPlatformProfile.ts');
      const { getFullStackProfile } = await import('../src/profiles/fullStackProfile.ts');
      const { getJavaBackendProfile } = await import('../src/profiles/javaBackendProfile.ts');
      const { getPlsqlProfile } = await import('../src/profiles/plsqlProfile.ts');
      const { DEFAULT_TARGET_COMPANIES } = await import('../src/profiles/targetCompanies.ts');

      const customEnv = {
        RECIPIENT_EMAIL: 'default@test.com',
        RECIPIENT_EMAIL_POWERPLATFORM: 'celine@test.com',
        RECIPIENT_EMAIL_FULLSTACK: 'vishnu@test.com',
        RECIPIENT_EMAIL_JAVA: 'aswin@test.com',
        RECIPIENT_EMAIL_PLSQL: 'minnu@test.com'
      };

      const pp = getPowerPlatformProfile(customEnv);
      const fs = getFullStackProfile(customEnv);
      const java = getJavaBackendProfile(customEnv);
      const plsql = getPlsqlProfile(customEnv);

      assert.strictEqual(pp.candidateName, 'Celine');
      assert.strictEqual(pp.recipientEmail, 'default@test.com, celine@test.com');
      assert.strictEqual(fs.candidateName, 'Vishnu');
      assert.strictEqual(fs.recipientEmail, 'default@test.com, vishnu@test.com');
      assert.strictEqual(java.candidateName, 'Aswin');
      assert.strictEqual(java.recipientEmail, 'default@test.com, aswin@test.com');
      assert.strictEqual(plsql.candidateName, 'Minnu');
      assert.strictEqual(plsql.recipientEmail, 'default@test.com, minnu@test.com');

      assert.ok(DEFAULT_TARGET_COMPANIES.length >= 20, 'Should load common target companies');
    });
  });
});
