import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseRemotiveJob,
  parseJobicyJob,
  parseArbeitnowJob,
  parseRssItem
} from '../src/scraper.ts';

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
});
