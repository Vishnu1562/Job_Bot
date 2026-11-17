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

export function buildPortalHtml(data: PortalData): string {
  const templatePath = path.join(__dirname, 'template.html');
  const template = fs.readFileSync(templatePath, 'utf-8');

  const profilePillsHtml = data.profiles
    .map(
      p => `
        <button class="pill-btn" data-profile="${escapeHtml(p.id)}">
          ${escapeHtml(p.name)} (${p.jobsCount})
        </button>`
    )
    .join('');

  const jsonString = JSON.stringify(data);

  return template
    .replace(/\{\{TOTAL_JOBS_COUNT\}\}/g, String(data.totalJobsCount))
    .replace(/\{\{PROFILE_PILLS\}\}/g, profilePillsHtml)
    .replace(/\{\{PORTAL_DATA_JSON\}\}/g, jsonString);
}

export function generateWebPortal(
  db: JobDatabase,
  profiles: JobProfile[],
  outputDir: string = 'docs'
): { portalData: PortalData; indexPath: string; jsonPath: string; cssPath: string; jsPath: string } {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const portalData = exportPortalData(db, profiles);
  const html = buildPortalHtml(portalData);
  const css = getPortalCss();
  const js = getPortalJs();

  const indexPath = path.join(outputDir, 'index.html');
  const cssPath = path.join(outputDir, 'styles.css');
  const jsPath = path.join(outputDir, 'app.js');
  const jsonPath = path.join(outputDir, 'jobs.json');
  const nojekyllPath = path.join(outputDir, '.nojekyll');

  fs.writeFileSync(indexPath, html, 'utf-8');
  fs.writeFileSync(cssPath, css, 'utf-8');
  fs.writeFileSync(jsPath, js, 'utf-8');
  fs.writeFileSync(jsonPath, JSON.stringify(portalData, null, 2), 'utf-8');
  if (!fs.existsSync(nojekyllPath)) {
    fs.writeFileSync(nojekyllPath, '', 'utf-8');
  }

  return { portalData, indexPath, jsonPath, cssPath, jsPath };
}
