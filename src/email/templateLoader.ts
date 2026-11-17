import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, 'templates');

// In-memory cache for fast template access
const templateCache = new Map<string, string>();

/**
 * Loads a standalone HTML template file from src/email/templates/.
 * If a profileId is specified, checks if a profile-specific template exists first
 * (e.g., templates/profiles/${profileId}/${templateName}),
 * falling back cleanly to the generic shared template.
 */
export function loadTemplate(templateName: string, profileId?: string): string {
  if (profileId) {
    const profileSpecificPath = path.join(TEMPLATES_DIR, 'profiles', profileId, templateName);
    if (fs.existsSync(profileSpecificPath)) {
      const cacheKey = `${profileId}:${templateName}`;
      if (!templateCache.has(cacheKey)) {
        templateCache.set(cacheKey, fs.readFileSync(profileSpecificPath, 'utf-8'));
      }
      return templateCache.get(cacheKey)!;
    }
  }

  const genericPath = path.join(TEMPLATES_DIR, templateName);
  if (!templateCache.has(templateName)) {
    if (fs.existsSync(genericPath)) {
      templateCache.set(templateName, fs.readFileSync(genericPath, 'utf-8'));
    } else {
      throw new Error(`Template not found: ${templateName} at ${genericPath}`);
    }
  }

  return templateCache.get(templateName)!;
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
