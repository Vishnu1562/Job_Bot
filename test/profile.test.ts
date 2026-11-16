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
});
