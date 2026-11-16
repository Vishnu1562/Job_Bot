interface SkillRule {
  tag: string;
  patterns: (string | RegExp)[];
}

const SKILL_RULES: SkillRule[] = [
  {
    tag: '[Canvas Apps]',
    patterns: ['canvas app', 'canvas apps', /\bcanvas\b/i]
  },
  {
    tag: '[Model-Driven]',
    patterns: ['model driven', 'model-driven', 'modeldriven']
  },
  {
    tag: '[Dataverse]',
    patterns: ['dataverse', 'common data service', /\bcds\b/i]
  },
  {
    tag: '[PCF]',
    patterns: ['pcf', 'power apps component framework', 'powerapps component framework']
  },
  {
    tag: '[Power Automate]',
    patterns: ['power automate', 'powerautomate', 'cloud flow', 'ms flow', 'flow designer']
  },
  {
    tag: '[Copilot Studio]',
    patterns: ['copilot studio', 'power virtual agents', /\bpva\b/i, 'copilot']
  },
  {
    tag: '[Power Pages]',
    patterns: ['power pages', 'powerpages', 'power portals', 'power apps portal']
  },
  {
    tag: '[Dynamics 365]',
    patterns: ['dynamics 365', /\bd365\b/i, 'dynamics crm']
  }
];

export function extractSkillTags(title: string, description: string = ''): string[] {
  const combined = `${title} ${description}`;
  const foundTags: string[] = [];

  for (const rule of SKILL_RULES) {
    const matches = rule.patterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return combined.toLowerCase().includes(pattern.toLowerCase());
      }
      return pattern.test(combined);
    });

    if (matches && !foundTags.includes(rule.tag)) {
      foundTags.push(rule.tag);
    }
  }

  // If no specific sub-skill was matched, default to [Power Platform]
  if (foundTags.length === 0) {
    foundTags.push('[Power Platform]');
  }

  return foundTags;
}
