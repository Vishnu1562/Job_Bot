import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import type { JobDatabase } from '../db/jobDatabase.ts';
import type { JobProfile } from '../profiles/profileRegistry.ts';
import { exportPortalData, type PortalData } from './portalDataExporter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getPortalCss(): string {
  const cssPath = path.join(__dirname, 'styles.css');
  return fs.readFileSync(cssPath, 'utf-8');
}

export function getPortalJs(): string {
  const tsPath = path.join(__dirname, 'app.ts');
  const tsContent = fs.readFileSync(tsPath, 'utf-8');
  if (typeof stripTypeScriptTypes === 'function') {
    return stripTypeScriptTypes(tsContent);
  }
  return tsContent;
}

export function getPortalFavicon(): string {
  const faviconPath = path.join(__dirname, 'favicon.svg');
  return fs.readFileSync(faviconPath, 'utf-8');
}

export function formatProfileShortName(name: string): string {
  if (!name) return '';
  return name
    .replace(/\s+(Developer\s+)?Job\s+Radar$/i, '')
    .replace(/\s+Radar$/i, '')
    .trim();
}

export function buildPortalHtml(data: PortalData): string {
  const templatePath = path.join(__dirname, 'template.html');
  const template = fs.readFileSync(templatePath, 'utf-8');

  const profilePillsHtml = data.profiles
    .map(p => {
      const shortName = formatProfileShortName(p.name);
      const dotColor = p.accentColor || '#6366f1';
      return `
        <button class="profile-tab-btn" data-profile="${escapeHtml(p.id)}">
          <span class="tab-dot" style="background-color: ${escapeHtml(dotColor)};"></span>
          <span class="tab-title">${escapeHtml(shortName)}</span>
          <span class="tab-count">${p.jobsCount}</span>
        </button>`;
    })
    .join('');

  const profileOptionsHtml = data.profiles
    .map(p => {
      const shortName = formatProfileShortName(p.name);
      return `<option value="${escapeHtml(p.id)}">${escapeHtml(shortName)} (${p.jobsCount})</option>`;
    })
    .join('');

  const jsonString = JSON.stringify(data);

  let lastSyncedFormatted = 'Just now';
  try {
    const genDate = new Date(data.generatedAt);
    lastSyncedFormatted = genDate.toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  } catch {
    lastSyncedFormatted = data.generatedAt || 'Recent';
  }

  return template
    .replace(/\{\{TOTAL_JOBS_COUNT\}\}/g, String(data.totalJobsCount))
    .replace(/\{\{LAST_SYNCED_TIME\}\}/g, lastSyncedFormatted)
    .replace(/\{\{PROFILE_PILLS\}\}/g, profilePillsHtml)
    .replace(/\{\{PROFILE_OPTIONS\}\}/g, profileOptionsHtml)
    .replace(/\{\{PORTAL_DATA_JSON\}\}/g, jsonString);
}

export function generateWebPortal(
  db: JobDatabase,
  profiles: JobProfile[],
  outputDir: string = 'docs'
): { portalData: PortalData; indexPath: string; jsonPath: string; cssPath: string; jsPath: string; faviconPath: string } {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const portalData = exportPortalData(db, profiles);
  const html = buildPortalHtml(portalData);
  const css = getPortalCss();
  const js = getPortalJs();
  const favicon = getPortalFavicon();

  const indexPath = path.join(outputDir, 'index.html');
  const cssPath = path.join(outputDir, 'styles.css');
  const jsPath = path.join(outputDir, 'app.js');
  const jsonPath = path.join(outputDir, 'jobs.json');
  const nojekyllPath = path.join(outputDir, '.nojekyll');
  const faviconPath = path.join(outputDir, 'favicon.svg');

  fs.writeFileSync(indexPath, html, 'utf-8');
  fs.writeFileSync(cssPath, css, 'utf-8');
  fs.writeFileSync(jsPath, js, 'utf-8');
  fs.writeFileSync(faviconPath, favicon, 'utf-8');
  fs.writeFileSync(jsonPath, JSON.stringify(portalData, null, 2), 'utf-8');
  if (!fs.existsSync(nojekyllPath)) {
    fs.writeFileSync(nojekyllPath, '', 'utf-8');
  }

  return { portalData, indexPath, jsonPath, cssPath, jsPath, faviconPath };
}
