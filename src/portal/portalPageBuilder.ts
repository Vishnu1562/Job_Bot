import fs from 'node:fs';
import path from 'node:path';
import type { JobProfile } from '../types.ts';
import { JobDatabase } from '../db/jobDatabase.ts';
import { exportPortalData, type PortalData, type PortalJobItem } from './portalDataExporter.ts';

export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildPortalHtml(data: PortalData): string {
  const jsonString = JSON.stringify(data);
  const profilesJson = JSON.stringify(data.profiles);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Radar Portal • Multi-Profile Radar</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --emerald: #10b981;
      --emerald-bg: #064e3b;
      --blue: #3b82f6;
      --blue-bg: #1e3a8a;
      --amber: #f59e0b;
      --amber-bg: #78350f;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      line-height: 1.5;
      padding: 20px 16px 80px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 28px 24px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .header-top {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge-live {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }
    .badge-live::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 14px;
    }
    .controls {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .toolbar-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .search-bar {
      flex: 1;
      min-width: 260px;
      position: relative;
    }
    .search-bar input {
      width: 100%;
      background: #0f172a;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 12px 16px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-bar input:focus {
      border-color: var(--primary);
    }
    .filter-btn {
      background: #0f172a;
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }
    .filter-btn:hover {
      background: #1e293b;
      color: #fff;
      border-color: #475569;
    }
    .filter-btn.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }
    .date-heading {
      margin: 32px 0 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .date-badge {
      background: #334155;
      color: #f1f5f9;
      font-size: 14px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid #475569;
    }
    .section-header {
      background: #1e293b;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 12px 16px;
      margin: 16px 0 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-domestic .section-title { color: #34d399; }
    .section-remote .section-title { color: #60a5fa; }
    .jobs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .job-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .job-card:hover {
      transform: translateY(-2px);
      border-color: #64748b;
    }
    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
    }
    .job-source-tag {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .tag-domestic { background: var(--emerald-bg); color: #34d399; border: 1px solid #065f46; }
    .tag-remote { background: var(--blue-bg); color: #93c5fd; border: 1px solid #1e40af; }
    .priority-badge {
      background: var(--amber-bg);
      color: #fde047;
      border: 1px solid #b45309;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .job-title {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
      line-height: 1.3;
    }
    .job-company {
      font-size: 13px;
      color: #cbd5e1;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .job-location {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }
    .tag-pill {
      background: #0f172a;
      color: #94a3b8;
      border: 1px solid #334155;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 12px;
    }
    .card-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid #334155;
    }
    .action-btn-group {
      display: flex;
      gap: 6px;
    }
    .btn-action {
      background: #0f172a;
      border: 1px solid #334155;
      color: #94a3b8;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s;
    }
    .btn-action:hover {
      background: #1e293b;
      color: #fff;
      border-color: #64748b;
    }
    .btn-action.saved {
      background: #78350f;
      color: #fde047;
      border-color: #d97706;
    }
    .btn-action.applied {
      background: #064e3b;
      color: #6ee7b7;
      border-color: #059669;
    }
    .btn-apply {
      background: var(--primary);
      color: #fff;
      text-decoration: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: background 0.15s;
    }
    .btn-apply:hover {
      background: #2563eb;
    }
    .empty-state {
      background: var(--card-bg);
      border: 1px dashed var(--card-border);
      border-radius: 16px;
      padding: 48px 24px;
      text-align: center;
      color: var(--text-muted);
      margin: 40px 0;
    }
    .empty-icon { font-size: 40px; margin-bottom: 12px; }
    @media (max-width: 640px) {
      .jobs-grid { grid-template-columns: 1fr; }
      h1 { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="container" id="app">
    <!-- @portal:app -->
    <header>
      <div class="header-top">
        <h1>⚡ Multi-Profile Job Radar Portal</h1>
        <div class="badge-live">● Live Sync • Updated Daily</div>
      </div>
      <p class="subtitle">
        Live Curated Job Feed • Total <strong id="total-count-label">${data.totalJobsCount}</strong> active roles across profiles.
      </p>
    </header>

    <div class="controls">
      <!-- Profile Tabs -->
      <div class="toolbar-row" id="profile-tabs">
        <button class="filter-btn active" data-profile="all">All Roles</button>
        ${data.profiles
          .map(
            (p) => `
          <button class="filter-btn" data-profile="${escapeHtml(p.id)}">
            ${escapeHtml(p.name)} (${p.jobsCount})
          </button>`
          )
          .join('')}
      </div>

      <!-- Search & Status Row -->
      <div class="toolbar-row">
        <div class="search-bar">
          <input type="text" id="search-input" placeholder="🔍 Search by title, company, skills, or city...">
        </div>
        <div class="action-btn-group" id="status-filters">
          <button class="filter-btn active" data-status="all">All Active</button>
          <button class="filter-btn" data-status="saved">⭐ Saved (<span id="saved-count">0</span>)</button>
          <button class="filter-btn" data-status="applied">✅ Applied (<span id="applied-count">0</span>)</button>
        </div>
      </div>

      <!-- Secondary Filters: Date & Tier -->
      <div class="toolbar-row">
        <div class="action-btn-group" id="date-filters">
          <button class="filter-btn active" data-date="all">All Dates</button>
          <button class="filter-btn" data-date="today">Today's Batch</button>
          <button class="filter-btn" data-date="yesterday">Yesterday</button>
        </div>
        <div class="action-btn-group" id="tier-filters">
          <button class="filter-btn active" data-tier="all">All Tiers</button>
          <button class="filter-btn" data-tier="domestic">📍 Domestic Priority</button>
          <button class="filter-btn" data-tier="remote">🌐 Global Remote</button>
        </div>
      </div>
    </div>

    <!-- Main Dynamic Container -->
    <main id="listings-container">
      <!-- Injected by JavaScript -->
    </main>
  </div>

  <!-- Embedded JSON Bootstrap for Offline & Local File Fallback (EC-021) -->
  <script id="portal-data" type="application/json">
${jsonString}
  </script>

  <script>
    (function() {
      // 1. Data Bootstrap
      let portalData = null;
      try {
        const scriptElem = document.getElementById('portal-data');
        if (scriptElem && scriptElem.textContent) {
          portalData = JSON.parse(scriptElem.textContent);
        }
      } catch (e) {
        console.error('Failed to parse embedded bootstrap JSON:', e);
      }

      if (!portalData) {
        portalData = { allJobs: [], profiles: [], totalJobsCount: 0 };
      }

      // 2. LocalStorage Candidate Tracker
      const STORAGE_KEY = 'job_radar_tracker_v1';
      function getTrackerState() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : {};
        } catch {
          return {};
        }
      }

      function setTrackerState(state) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.warn('LocalStorage unavailable:', e);
        }
      }

      // 3. UI State
      let selectedProfile = 'all';
      let selectedStatus = 'all';
      let selectedDate = 'all';
      let selectedTier = 'all';
      let searchQuery = '';

      function updateCounts() {
        const state = getTrackerState();
        let saved = 0;
        let applied = 0;
        for (const key in state) {
          if (state[key].saved) saved++;
          if (state[key].applied) applied++;
        }
        const savedElem = document.getElementById('saved-count');
        const appliedElem = document.getElementById('applied-count');
        if (savedElem) savedElem.textContent = saved;
        if (appliedElem) appliedElem.textContent = applied;
      }

      function renderListings() {
        const container = document.getElementById('listings-container');
        if (!container) return;

        const trackerState = getTrackerState();
        const query = searchQuery.trim().toLowerCase();

        // Filter allJobs
        const filtered = portalData.allJobs.filter(job => {
          // Profile Filter
          if (selectedProfile !== 'all' && job.profileId !== selectedProfile) return false;

          // Status Filter
          const status = trackerState[job.url] || {};
          if (selectedStatus === 'saved' && !status.saved) return false;
          if (selectedStatus === 'applied' && !status.applied) return false;

          // Tier Filter
          if (selectedTier !== 'all' && job.tier !== selectedTier) return false;

          // Date Filter
          if (selectedDate === 'today' && job.dateLabel !== "Today's Batch") return false;
          if (selectedDate === 'yesterday' && job.dateLabel !== "Yesterday") return false;

          // Search Query
          if (query) {
            const matchTitle = (job.title || '').toLowerCase().includes(query);
            const matchCompany = (job.company || '').toLowerCase().includes(query);
            const matchLocation = (job.location || '').toLowerCase().includes(query);
            const matchTags = (job.tags || []).some(t => t.toLowerCase().includes(query));
            if (!matchTitle && !matchCompany && !matchLocation && !matchTags) return false;
          }

          return true;
        });

        if (filtered.length === 0) {
          container.innerHTML = \`
            <div class="empty-state">
              <div class="empty-icon">☀️</div>
              <h3>No Roles Found Matching Criteria</h3>
              <p>Try clearing your search query or selecting "All Roles" / "All Dates".</p>
            </div>
          \`;
          return;
        }

        // Group by Date Label (Today's jobs on top)
        const dateGroups = {};
        filtered.forEach(job => {
          const label = job.dateLabel || 'Archive';
          if (!dateGroups[label]) dateGroups[label] = [];
          dateGroups[label].push(job);
        });

        let html = '';

        for (const dateLabel of Object.keys(dateGroups)) {
          const dateJobs = dateGroups[dateLabel];
          const domesticJobs = dateJobs.filter(j => j.tier === 'domestic');
          const remoteJobs = dateJobs.filter(j => j.tier === 'remote');

          html += \`
            <div class="date-group-wrapper">
              <div class="date-heading">
                <span class="date-badge">🗓️ \${escapeHtml(dateLabel)} (\${dateJobs.length} Roles)</span>
              </div>
          \`;

          // Domestic Section
          if (domesticJobs.length > 0) {
            html += \`
              <div class="section-header section-domestic">
                <span class="section-title">📍 Domestic &amp; Regional Priority (LinkedIn, Naukri &amp; Corporate Boards)</span>
                <span style="font-size: 12px; color: #34d399; font-weight: 700;">\${domesticJobs.length} Verified</span>
              </div>
              <div class="jobs-grid">
                \${domesticJobs.map(j => renderCardHtml(j, trackerState[j.url] || {})).join('')}
              </div>
            \`;
          }

          // Remote Section
          if (remoteJobs.length > 0) {
            html += \`
              <div class="section-header section-remote">
                <span class="section-title">🌐 Curated Global &amp; Remote Opportunities</span>
                <span style="font-size: 12px; color: #60a5fa; font-weight: 700;">\${remoteJobs.length} Roles</span>
              </div>
              <div class="jobs-grid">
                \${remoteJobs.map(j => renderCardHtml(j, trackerState[j.url] || {})).join('')}
              </div>
            \`;
          }

          html += '</div>';
        }

        container.innerHTML = html;
        bindCardActions();
      }

      function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      function renderCardHtml(job, status) {
        const isSaved = Boolean(status.saved);
        const isApplied = Boolean(status.applied);
        const tierClass = job.tier === 'domestic' ? 'tag-domestic' : 'tag-remote';
        const tierLabel = job.tier === 'domestic' ? '📍 Domestic Priority' : '🌐 Global Remote';

        const priorityBadge = job.isTargetCompany
          ? '<span class="priority-badge">⭐ Priority Target</span>'
          : '';

        const tagsHtml = (job.tags || [])
          .map(t => \`<span class="tag-pill">\${escapeHtml(t)}</span>\`)
          .join('');

        return \`
          <div class="job-card" data-url="\${escapeHtml(job.url)}">
            <div>
              <div class="job-header">
                <span class="job-source-tag \${tierClass}">\${tierLabel} • \${escapeHtml(job.source.toUpperCase())}</span>
                \${priorityBadge}
              </div>
              <h3 class="job-title">\${escapeHtml(job.title)}</h3>
              <p class="job-company">\${escapeHtml(job.company)}</p>
              <p class="job-location">📍 \${escapeHtml(job.location)}</p>
              <div class="tags-container">
                \${tagsHtml}
              </div>
            </div>
            <div class="card-actions">
              <div class="action-btn-group">
                <button class="btn-action \${isSaved ? 'saved' : ''}" data-action="save">
                  ⭐ \${isSaved ? 'Saved' : 'Save'}
                </button>
                <button class="btn-action \${isApplied ? 'applied' : ''}" data-action="applied">
                  ✅ \${isApplied ? 'Applied' : 'Apply'}
                </button>
              </div>
              <a href="\${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="btn-apply">
                Apply Now ↗
              </a>
            </div>
          </div>
        \`;
      }

      function bindCardActions() {
        document.querySelectorAll('.btn-action').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.job-card');
            if (!card) return;
            const url = card.getAttribute('data-url');
            const action = this.getAttribute('data-action');
            if (!url || !action) return;

            const state = getTrackerState();
            if (!state[url]) state[url] = { saved: false, applied: false };

            if (action === 'save') {
              state[url].saved = !state[url].saved;
            } else if (action === 'applied') {
              state[url].applied = !state[url].applied;
            }

            setTrackerState(state);
            updateCounts();
            renderListings();
          });
        });
      }

      // Event Listeners for Controls
      function setupEvents() {
        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.addEventListener('input', function() {
            searchQuery = this.value;
            renderListings();
          });
        }

        // Profile Tabs
        document.querySelectorAll('#profile-tabs button').forEach(btn => {
          btn.addEventListener('click', function() {
            document.querySelectorAll('#profile-tabs button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedProfile = this.getAttribute('data-profile');
            renderListings();
          });
        });

        // Status Tabs
        document.querySelectorAll('#status-filters button').forEach(btn => {
          btn.addEventListener('click', function() {
            document.querySelectorAll('#status-filters button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedStatus = this.getAttribute('data-status');
            renderListings();
          });
        });

        // Date Tabs
        document.querySelectorAll('#date-filters button').forEach(btn => {
          btn.addEventListener('click', function() {
            document.querySelectorAll('#date-filters button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedDate = this.getAttribute('data-date');
            renderListings();
          });
        });

        // Tier Tabs
        document.querySelectorAll('#tier-filters button').forEach(btn => {
          btn.addEventListener('click', function() {
            document.querySelectorAll('#tier-filters button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedTier = this.getAttribute('data-tier');
            renderListings();
          });
        });
      }

      // Init
      updateCounts();
      setupEvents();
      renderListings();
    })();
  </script>
</body>
</html>`;
}

export function generateWebPortal(
  db: JobDatabase,
  profiles: JobProfile[],
  outputDir: string = 'docs'
): { portalData: PortalData; indexPath: string; jsonPath: string } {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const portalData = exportPortalData(db, profiles);
  const html = buildPortalHtml(portalData);

  const indexPath = path.join(outputDir, 'index.html');
  const jsonPath = path.join(outputDir, 'jobs.json');
  const nojekyllPath = path.join(outputDir, '.nojekyll');

  fs.writeFileSync(indexPath, html, 'utf-8');
  fs.writeFileSync(jsonPath, JSON.stringify(portalData, null, 2), 'utf-8');
  if (!fs.existsSync(nojekyllPath)) {
    fs.writeFileSync(nojekyllPath, '', 'utf-8');
  }

  return { portalData, indexPath, jsonPath };
}
