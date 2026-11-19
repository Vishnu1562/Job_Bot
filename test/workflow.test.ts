import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('GitHub Actions Workflow Specification (HF-052)', () => {
  const workflowPath = path.resolve('.github/workflows/daily_radar.yml');

  it('workflow file must exist', () => {
    assert.strictEqual(fs.existsSync(workflowPath), true, 'daily_radar.yml must exist');
  });

  it('must decommission internal schedule: to prevent 7-8 hour delayed ghost runs (HF-052)', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.strictEqual(
      content.includes('schedule:'),
      false,
      'Internal schedule: block must be decommissioned in favor of punctual external webhook dispatch'
    );
  });

  it('must support workflow_dispatch with force_dispatch input for external webhooks and manual triggers (HF-052)', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.strictEqual(content.includes('workflow_dispatch:'), true, 'workflow_dispatch must be defined');
    assert.strictEqual(content.includes('force_dispatch:'), true, 'force_dispatch input must be defined');
  });

  it('must preserve concurrency locking to avoid overlapping runs', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.strictEqual(content.includes('group: job-radar-lock'), true, 'concurrency lock must be present');
  });
});
