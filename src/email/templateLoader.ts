import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, 'templates');
const MASTER_TEMPLATE_NAME = 'emailDigest.html';

// Cache for raw template files and extracted snippets
let masterTemplateRaw: string | null = null;
const snippetCache = new Map<string, string>();

function getMasterTemplateContent(profileId?: string): string {
  if (profileId) {
    const profileSpecificPath = path.join(TEMPLATES_DIR, 'profiles', `${profileId}.html`);
    if (fs.existsSync(profileSpecificPath)) {
      return fs.readFileSync(profileSpecificPath, 'utf-8');
    }
  }

  const genericPath = path.join(TEMPLATES_DIR, MASTER_TEMPLATE_NAME);
  if (!masterTemplateRaw) {
    if (fs.existsSync(genericPath)) {
      masterTemplateRaw = fs.readFileSync(genericPath, 'utf-8');
    } else {
      throw new Error(`Master template not found: ${genericPath}`);
    }
  }
  return masterTemplateRaw;
}

/**
 * Extracts a sub-component snippet from emailDigest.html by comment markers.
 */
export function getTemplateSnippet(
  snippetKey: 'jobCard' | 'sectionHeader' | 'greetingCard' | 'emptyState' | 'overflowCard',
  profileId?: string
): string {
  const cacheKey = `${profileId || 'default'}:${snippetKey}`;
  if (snippetCache.has(cacheKey)) {
    return snippetCache.get(cacheKey)!;
  }

  const content = getMasterTemplateContent(profileId);
  const tagKey = snippetKey.replace(/([A-Z])/g, '_$1').toUpperCase(); // e.g. jobCard -> JOB_CARD
  const regex = new RegExp(`<!--\\s*${tagKey}_START\\s*-->([\\s\\S]*?)<!--\\s*${tagKey}_END\\s*-->`, 'i');
  const match = content.match(regex);

  if (!match) {
    throw new Error(`Template snippet "${snippetKey}" (tag: ${tagKey}) not found in ${MASTER_TEMPLATE_NAME}`);
  }

  const snippet = match[1].trim();
  snippetCache.set(cacheKey, snippet);
  return snippet;
}

/**
 * Loads the master email digest layout with template snippet definition blocks stripped out.
 */
export function loadEmailTemplate(profileId?: string): string {
  const content = getMasterTemplateContent(profileId);
  const cleanLayout = content
    .replace(/<!--\s*TEMPLATE_SNIPPETS_START\s*-->[\s\S]*?<!--\s*TEMPLATE_SNIPPETS_END\s*-->/i, '')
    .trim();
  return cleanLayout;
}

/**
 * Replaces {{placeholder}} tokens with values.
 * Any unmatched {{token}} is safely replaced with an empty string.
 */
export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, token) => {
    if (Object.prototype.hasOwnProperty.call(vars, token)) {
      const val = vars[token];
      return val !== undefined && val !== null ? String(val) : '';
    }
    return '';
  });
}
