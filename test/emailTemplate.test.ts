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
    assert.ok(html.includes('Radar active &amp; scanning') || html.includes('Radar active & scanning') || html.includes('Radar active'));
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
});
