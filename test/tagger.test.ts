import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractSkillTags } from '../src/tagger.ts';

describe('[HF-002 & VR-002] Skill Tagger', () => {
  it('extracts known Power Platform skills from text', () => {
    const title = 'Power Apps Senior Developer';
    const description = `
      We need a strong consultant with experience in Canvas Apps and Model-Driven apps.
      Must have created custom controls using PCF (Power Apps Component Framework)
      and integrated Dataverse with Power Automate flows.
      Experience with Copilot Studio or Power Virtual Agents is a plus.
    `;

    const tags = extractSkillTags(title, description);

    assert.ok(tags.includes('[Canvas Apps]'));
    assert.ok(tags.includes('[Model-Driven]'));
    assert.ok(tags.includes('[Dataverse]'));
    assert.ok(tags.includes('[PCF]'));
    assert.ok(tags.includes('[Power Automate]'));
    assert.ok(tags.includes('[Copilot Studio]'));
  });

  it('detects Power Pages and Dynamics 365', () => {
    const title = 'Dynamics 365 / Power Pages Consultant';
    const description = 'Build customer self-service portals with Power Pages connected to Dynamics 365 CRM.';

    const tags = extractSkillTags(title, description);

    assert.ok(tags.includes('[Power Pages]'));
    assert.ok(tags.includes('[Dynamics 365]'));
  });

  it('falls back to [Power Platform] if no specific sub-skill is mentioned (VR-002)', () => {
    const title = 'Power Platform Developer';
    const description = 'Looking for an experienced developer with Microsoft business applications expertise.';

    const tags = extractSkillTags(title, description);

    assert.ok(tags.includes('[Power Platform]'));
    assert.ok(tags.length >= 1);
  });
});
