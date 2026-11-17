// Job Radar • Client Application Controller (TypeScript)
// Handles theme, view switcher, search, filters, drawer, metrics, and bookmark actions

interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  tags?: string[];
  source?: string;
  description?: string;
  tier?: 'domestic' | 'remote';
  dateLabel?: string;
  isTargetCompany?: boolean;
  profileId?: string;
  scrapedAt?: string;
}

interface ProfileItem {
  id: string;
  name: string;
  accentColor: string;
  jobsCount: number;
}

interface PortalPayload {
  allJobs: JobItem[];
  profiles: ProfileItem[];
  totalJobsCount: number;
}

interface TrackerEntry {
  saved?: boolean;
  applied?: boolean;
}

type TrackerState = Record<string, TrackerEntry>;

(function () {
  // 1. Parse Embedded Bootstrap Data
  let portalData: PortalPayload = { allJobs: [], profiles: [], totalJobsCount: 0 };
  try {
    const scriptElem = document.getElementById('portal-data');
    if (scriptElem && scriptElem.textContent) {
      portalData = JSON.parse(scriptElem.textContent);
    }
  } catch (e) {
    console.error('Failed to parse embedded bootstrap JSON:', e);
  }

  // 2. LocalStorage Persistence Keys
  const TRACKER_KEY = 'job_radar_tracker_v1';
  const THEME_KEY = 'job_radar_theme';
  const VIEW_KEY = 'job_radar_view_mode';

  function getTrackerState(): TrackerState {
    try {
      const raw = localStorage.getItem(TRACKER_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function setTrackerState(state: TrackerState): void {
    try {
      localStorage.setItem(TRACKER_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  // 3. Branded Company Monograms (Deterministic Color Generator)
  const MONOGRAM_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6'
  ];

  function getMonogramColor(company: string): string {
    if (!company) return MONOGRAM_COLORS[0];
    let hash = 0;
    for (let i = 0; i < company.length; i++) {
      hash = company.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % MONOGRAM_COLORS.length;
    return MONOGRAM_COLORS[index];
  }

  function getInitials(name: string): string {
    if (!name) return '•';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // 3b. Professional SVG Vector Icons (HF-049)
  const ICONS = {
    locationPin: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    globe: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    star: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    bookmark: (fill: boolean = false) => `<svg width="12" height="12" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
    check: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    calendar: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
  };

  // 4. UI State
  let selectedProfile = 'all';
  let selectedStatus = 'all';
  let selectedDate = 'all';
  let selectedTier = 'all';
  let currentViewMode = localStorage.getItem(VIEW_KEY) || 'grid';
  let searchQuery = '';
  let activeDrawerJob: JobItem | null = null;

  // 5. Toast Feedback System
  let toastTimer: any = null;
  function showToast(message: string, icon = '✨'): void {
    const toast = document.getElementById('toast-notification');
    const msgElem = document.getElementById('toast-message');
    const iconElem = document.getElementById('toast-icon');
    if (!toast || !msgElem || !iconElem) return;

    msgElem.textContent = message;
    iconElem.innerHTML = icon;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // 6. Theme Engine
  function initTheme(): void {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const toggleBtn = document.getElementById('theme-toggle');
    if (savedTheme === 'light') {
      document.body.classList.add('light');
      if (toggleBtn) toggleBtn.innerHTML = ICONS.sun;
    } else {
      document.body.classList.remove('light');
      if (toggleBtn) toggleBtn.innerHTML = ICONS.moon;
    }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light');
        toggleBtn.innerHTML = isLight ? ICONS.sun : ICONS.moon;
        localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
        showToast(isLight ? 'Switched to Light Mode' : 'Switched to Dark Mode', isLight ? ICONS.sun : ICONS.moon);
      });
    }
  }

  // 7. Live KPI Summary Bar Calculations
  function updateMetrics(): void {
    const tracker = getTrackerState();
    let totalCount = portalData.allJobs.length;
    let todayCount = 0;
    let domesticCount = 0;
    let savedCount = 0;
    let appliedCount = 0;

    portalData.allJobs.forEach(job => {
      if (job.dateLabel === "Today's Batch") todayCount++;
      if (job.tier === 'domestic') domesticCount++;
      const st = tracker[job.url];
      if (st && st.saved) savedCount++;
      if (st && st.applied) appliedCount++;
    });

    const kpiTotal = document.getElementById('kpi-total-jobs');
    const kpiToday = document.getElementById('kpi-today-jobs');
    const kpiDomestic = document.getElementById('kpi-domestic-jobs');
    const kpiSaved = document.getElementById('kpi-saved-jobs');
    const statusSavedBadge = document.getElementById('status-saved-badge');
    const statusAppliedBadge = document.getElementById('status-applied-badge');

    if (kpiTotal) kpiTotal.textContent = String(totalCount);
    if (kpiToday) kpiToday.textContent = String(todayCount);
    if (kpiDomestic) kpiDomestic.textContent = String(domesticCount);
    if (kpiSaved) kpiSaved.textContent = String(savedCount);
    if (statusSavedBadge) statusSavedBadge.textContent = String(savedCount);
    if (statusAppliedBadge) statusAppliedBadge.textContent = String(appliedCount);
  }

  // 8. Drawer Sheet Engine
  function openDrawer(job: JobItem): void {
    activeDrawerJob = job;
    const drawer = document.getElementById('job-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (!drawer || !overlay) return;

    const tracker = getTrackerState();
    const status = tracker[job.url] || {};

    const monogramElem = document.getElementById('drawer-company-monogram');
    const companyElem = document.getElementById('drawer-company');
    const titleElem = document.getElementById('drawer-title');
    const locationElem = document.getElementById('drawer-location');
    const badgesElem = document.getElementById('drawer-badges');
    const skillsElem = document.getElementById('drawer-skills');
    const descElem = document.getElementById('drawer-description');
    const applyLink = document.getElementById('drawer-apply-link') as HTMLAnchorElement | null;
    const saveBtn = document.getElementById('drawer-save-btn');
    const appliedBtn = document.getElementById('drawer-applied-btn');

    if (monogramElem) {
      monogramElem.textContent = getInitials(job.company);
      monogramElem.style.backgroundColor = getMonogramColor(job.company);
    }
    if (companyElem) companyElem.textContent = job.company;
    if (titleElem) titleElem.textContent = job.title;
    if (locationElem) locationElem.innerHTML = `${ICONS.locationPin} <span>${escapeHtml(job.location || 'Location Not Specified')}</span>`;

    if (badgesElem) {
      const tierBadge = job.tier === 'domestic'
        ? `<span class="badge-tier-sm badge-domestic">${ICONS.locationPin}Domestic Priority</span>`
        : `<span class="badge-tier-sm badge-remote">${ICONS.globe}Global Remote</span>`;
      const targetBadge = job.isTargetCompany
        ? `<span class="badge-priority-target">${ICONS.star}Priority Target Company</span>`
        : '';
      const dateBadge = `<span class="date-pill" style="font-size: 11px;">${ICONS.calendar}${escapeHtml(job.dateLabel || 'Archive')}</span>`;
      badgesElem.innerHTML = tierBadge + targetBadge + dateBadge;
    }

    if (skillsElem) {
      skillsElem.innerHTML = (job.tags || [])
        .map(t => `<span class="skill-tag-pill">${escapeHtml(t)}</span>`)
        .join('');
    }

    if (descElem) {
      const desc = (job.description || '').trim();
      descElem.textContent = desc || 'Detailed requirements and job description available on employer site.';
    }

    if (applyLink) {
      applyLink.href = job.url;
    }

    if (saveBtn) {
      saveBtn.classList.toggle('saved', Boolean(status.saved));
      saveBtn.innerHTML = `${ICONS.bookmark(Boolean(status.saved))} ${status.saved ? 'Saved' : 'Save'}`;
    }
    if (appliedBtn) {
      appliedBtn.classList.toggle('applied', Boolean(status.applied));
      appliedBtn.innerHTML = `${ICONS.check} ${status.applied ? 'Applied' : 'Applied'}`;
    }

    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer(): void {
    const drawer = document.getElementById('job-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
    activeDrawerJob = null;
  }

  function escapeHtml(str: string): string {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 9. Card and Table Markup Builders
  function renderCard(job: JobItem, status: TrackerEntry): string {
    const isSaved = Boolean(status.saved);
    const isApplied = Boolean(status.applied);
    const monogramColor = getMonogramColor(job.company);
    const initials = getInitials(job.company);

    const tierBadge = job.tier === 'domestic'
      ? `<span class="badge-tier-sm badge-domestic">${ICONS.locationPin}Domestic Priority</span>`
      : `<span class="badge-tier-sm badge-remote">${ICONS.globe}Global Remote</span>`;
    const targetBadge = job.isTargetCompany
      ? `<span class="badge-priority-target">${ICONS.star}Priority Target</span>`
      : '';

    const skillsHtml = (job.tags || []).slice(0, 4)
      .map(t => '<span class="skill-tag-pill">' + escapeHtml(t) + '</span>')
      .join('');

    return `
      <div class="job-card" data-url="${escapeHtml(job.url)}">
        <div class="card-clickable-area">
          <div class="card-top">
            <div class="company-monogram" style="background-color: ${monogramColor};">
              ${initials}
            </div>
            <div class="card-header-content">
              <div class="card-badges-row">
                ${tierBadge}
                ${targetBadge}
              </div>
              <h3 class="card-title">${escapeHtml(job.title)}</h3>
              <div class="card-company">${escapeHtml(job.company)}</div>
              <div class="card-location">${ICONS.locationPin} ${escapeHtml(job.location)}</div>
            </div>
          </div>
          <div class="card-skills-wrap">
            ${skillsHtml}
          </div>
        </div>
        <div class="card-footer" onclick="event.stopPropagation();">
          <div class="card-action-group">
            <button type="button" class="action-icon-btn ${isSaved ? 'saved' : ''}" data-action="save" onclick="event.stopPropagation();">
              ${ICONS.bookmark(isSaved)} ${isSaved ? 'Saved' : 'Save'}
            </button>
            <button type="button" class="action-icon-btn ${isApplied ? 'applied' : ''}" data-action="applied" onclick="event.stopPropagation();">
              ${ICONS.check} ${isApplied ? 'Applied' : 'Applied'}
            </button>
          </div>
          <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="btn-apply-cta" onclick="event.stopPropagation();">
            Apply Now ↗
          </a>
        </div>
      </div>
    `;
  }

  function renderTableRow(job: JobItem, status: TrackerEntry): string {
    const isSaved = Boolean(status.saved);
    const isApplied = Boolean(status.applied);
    const monogramColor = getMonogramColor(job.company);
    const initials = getInitials(job.company);

    const tierBadge = job.tier === 'domestic'
      ? `<span class="badge-tier-sm badge-domestic">${ICONS.locationPin}Domestic</span>`
      : `<span class="badge-tier-sm badge-remote">${ICONS.globe}Remote</span>`;

    return `
      <tr data-url="${escapeHtml(job.url)}">
        <td>
          <div class="table-company-cell">
            <div class="monogram-sm" style="background-color: ${monogramColor};">
              ${initials}
            </div>
            <div>
              <div style="font-weight: 700; color: var(--text-main); font-size: 14px;">${escapeHtml(job.company)}</div>
              ${job.isTargetCompany ? `<span style="font-size: 11px; color: var(--amber); font-weight: 700;">${ICONS.star}Priority Target</span>` : ''}
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight: 700; font-size: 14px; color: var(--text-main); margin-bottom: 4px;">
            ${escapeHtml(job.title)}
          </div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${(job.tags || []).slice(0, 3).map(t => '<span class="skill-tag-pill" style="font-size: 10px; padding: 2px 7px;">' + escapeHtml(t) + '</span>').join('')}
          </div>
        </td>
        <td>${tierBadge}</td>
        <td style="color: var(--text-dim); font-size: 13px;">${ICONS.locationPin} ${escapeHtml(job.location)}</td>
        <td class="table-action-cell" style="text-align: right;" onclick="event.stopPropagation();">
          <div class="card-action-group" style="justify-content: flex-end;">
            <button type="button" class="action-icon-btn ${isSaved ? 'saved' : ''}" data-action="save" title="Save Role" onclick="event.stopPropagation();">
              ${ICONS.bookmark(isSaved)}
            </button>
            <button type="button" class="action-icon-btn ${isApplied ? 'applied' : ''}" data-action="applied" title="Mark as Applied" onclick="event.stopPropagation();">
              ${ICONS.check}
            </button>
            <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="btn-apply-cta" onclick="event.stopPropagation();">
              Apply ↗
            </a>
          </div>
        </td>
      </tr>
    `;
  }

  // 10. Action Controller (HF-043: Isolated Event Handling)
  function toggleAction(url: string, action: 'save' | 'applied'): void {
    if (!url || !action) return;
    const state = getTrackerState();
    if (!state[url]) state[url] = { saved: false, applied: false };

    if (action === 'save') {
      state[url].saved = !state[url].saved;
      showToast(state[url].saved ? 'Saved role to bookmarks' : 'Removed from saved roles', ICONS.bookmark(state[url].saved));
    } else if (action === 'applied') {
      state[url].applied = !state[url].applied;
      showToast(state[url].applied ? 'Marked role as applied' : 'Removed applied status', ICONS.check);
    }

    setTrackerState(state);
    updateMetrics();

    // If active filter is 'saved' or 'applied', filter requires re-render
    if (selectedStatus === 'saved' || selectedStatus === 'applied') {
      render();
      return;
    }

    // Otherwise update elements in place without full DOM rebuild (no scroll jump, no drawer trigger)
    const isSaved = Boolean(state[url].saved);
    const isApplied = Boolean(state[url].applied);

    document.querySelectorAll(`[data-url="${CSS.escape ? CSS.escape(url) : url}"]`).forEach(cardOrRow => {
      const saveBtn = cardOrRow.querySelector('[data-action="save"]');
      const appliedBtn = cardOrRow.querySelector('[data-action="applied"]');

      if (saveBtn) {
        saveBtn.classList.toggle('saved', isSaved);
        if (saveBtn.textContent && saveBtn.textContent.includes('Save')) {
          saveBtn.innerHTML = `${ICONS.bookmark(isSaved)} ${isSaved ? 'Saved' : 'Save'}`;
        } else {
          saveBtn.innerHTML = ICONS.bookmark(isSaved);
        }
      }
      if (appliedBtn) {
        appliedBtn.classList.toggle('applied', isApplied);
        if (appliedBtn.textContent && appliedBtn.textContent.includes('Applied')) {
          appliedBtn.innerHTML = `${ICONS.check} ${isApplied ? 'Applied' : 'Applied'}`;
        } else {
          appliedBtn.innerHTML = ICONS.check;
        }
      }
    });

    if (activeDrawerJob && activeDrawerJob.url === url) {
      const drawerSave = document.getElementById('drawer-save-btn');
      const drawerApplied = document.getElementById('drawer-applied-btn');
      if (drawerSave) {
        drawerSave.classList.toggle('saved', isSaved);
        drawerSave.innerHTML = `${ICONS.bookmark(isSaved)} ${isSaved ? 'Saved' : 'Save'}`;
      }
      if (drawerApplied) {
        drawerApplied.classList.toggle('applied', isApplied);
        drawerApplied.innerHTML = `${ICONS.check} ${isApplied ? 'Applied' : 'Applied'}`;
      }
    }
  }

  // 10b. Collapsible Accordion Controller (HF-047)
  function toggleSectionCollapse(element: HTMLElement, targetSelector: string): void {
    const target = element.closest(targetSelector);
    if (target) {
      const isCollapsed = target.classList.toggle('collapsed');
      element.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
    }
  }

  // 11. Event Delegations & Bindings (HF-043 Guard & HF-047 Collapse)
  function bindJobEvents(): void {
    // Card & Table Row Click -> Opens Detail Drawer ONLY when clicking card body
    document.querySelectorAll('.job-card, .jobs-table tbody tr').forEach(item => {
      item.addEventListener('click', function (e) {
        const target = e.target as HTMLElement | null;
        if (!target) return;

        // GUARD [HF-043]: Never open drawer on buttons, links, footers, or action cells
        if (
          target.closest('.card-footer') ||
          target.closest('.card-action-group') ||
          target.closest('.action-icon-btn') ||
          target.closest('.table-action-cell') ||
          target.closest('button') ||
          target.closest('a')
        ) {
          return;
        }

        const url = this.getAttribute('data-url');
        if (!url) return;
        const job = portalData.allJobs.find(j => j.url === url);
        if (job) openDrawer(job);
      });
    });

    // Inline Action Buttons (Save / Applied)
    document.querySelectorAll('.action-icon-btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        const parent = this.closest('[data-url]');
        if (!parent) return;
        const url = parent.getAttribute('data-url');
        const action = this.getAttribute('data-action') as 'save' | 'applied';
        if (url && (action === 'save' || action === 'applied')) {
          toggleAction(url, action);
        }
      });
    });

    // Regional Section Collapsible Handlers (HF-047 & HF-048)
    document.querySelectorAll('.tier-header-bar').forEach(tierHeader => {
      tierHeader.addEventListener('click', function () {
        toggleSectionCollapse(this as HTMLElement, '.region-section-block');
      });
      tierHeader.addEventListener('keydown', function (e: Event) {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          keyEvent.preventDefault();
          toggleSectionCollapse(this as HTMLElement, '.region-section-block');
        }
      });
    });
  }

  function updateFilterResetVisibility(): void {
    const resetBtn = document.getElementById('filter-reset-btn');
    if (!resetBtn) return;
    const isFiltered =
      Boolean(searchQuery.trim()) ||
      selectedProfile !== 'all' ||
      selectedStatus !== 'all' ||
      selectedDate !== 'all' ||
      selectedTier !== 'all';
    resetBtn.style.display = isFiltered ? 'inline-flex' : 'none';
  }

  function resetAllFilters(): void {
    searchQuery = '';
    selectedProfile = 'all';
    selectedStatus = 'all';
    selectedDate = 'all';
    selectedTier = 'all';

    const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
    if (searchInput) searchInput.value = '';

    document.querySelectorAll('#profile-tabs-strip button').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-profile') === 'all');
    });
    document.querySelectorAll('#status-filters button').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-status') === 'all');
    });
    document.querySelectorAll('#tier-filters button').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tier') === 'all');
    });
    document.querySelectorAll('#date-filters button').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-date') === 'all');
    });

    showToast('Reset all filters', '🔄');
    render();
  }

  // 12. Main Render Engine
  function render(): void {
    updateFilterResetVisibility();
    const container = document.getElementById('listings-container');
    if (!container) return;

    const trackerState = getTrackerState();
    const query = searchQuery.trim().toLowerCase();

    const filtered = portalData.allJobs.filter(job => {
      if (selectedProfile !== 'all' && job.profileId !== selectedProfile) return false;

      const status = trackerState[job.url] || {};
      if (selectedStatus === 'saved' && !status.saved) return false;
      if (selectedStatus === 'applied' && !status.applied) return false;

      if (selectedTier !== 'all' && job.tier !== selectedTier) return false;

      if (selectedDate === 'today' && job.dateLabel !== "Today's Batch") return false;
      if (selectedDate === 'yesterday' && job.dateLabel !== "Yesterday") return false;

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
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3 style="font-size: 18px; color: var(--text-main); font-weight: 700; margin-bottom: 6px;">No Matching Opportunities</h3>
          <p>Try clearing your search query or selecting "All Dates" / "All Regions".</p>
        </div>
      `;
      return;
    }

    // Direct Regional Partitioning (HF-048: Flat SaaS Hierarchy)
    const domesticJobs = filtered.filter(j => j.tier === 'domestic');
    const remoteJobs = filtered.filter(j => j.tier === 'remote');

    let html = '';

    if (currentViewMode === 'grid') {
      // Domestic Grid Section
      if (domesticJobs.length > 0) {
        html += `
          <div class="region-section-block">
            <div class="tier-header-bar tier-domestic" role="button" tabindex="0" aria-expanded="true" aria-label="Toggle Domestic Region Section">
              <div class="tier-title-wrap">
                <span>${ICONS.locationPin}Domestic &amp; Regional Priority (LinkedIn, Naukri &amp; Corporate Boards)</span>
                <span class="collapse-chevron">▾</span>
              </div>
              <span class="tier-count-badge badge-domestic">${domesticJobs.length} Verified</span>
            </div>
            <div class="region-content-wrap">
              <div class="jobs-grid">
                ${domesticJobs.map(j => renderCard(j, trackerState[j.url] || {})).join('')}
              </div>
            </div>
          </div>
        `;
      }

      // Remote Grid Section
      if (remoteJobs.length > 0) {
        html += `
          <div class="region-section-block">
            <div class="tier-header-bar tier-remote" role="button" tabindex="0" aria-expanded="true" aria-label="Toggle Global Remote Section">
              <div class="tier-title-wrap">
                <span>${ICONS.globe}Curated Global &amp; Remote Opportunities</span>
                <span class="collapse-chevron">▾</span>
              </div>
              <span class="tier-count-badge badge-remote">${remoteJobs.length} Roles</span>
            </div>
            <div class="region-content-wrap">
              <div class="jobs-grid">
                ${remoteJobs.map(j => renderCard(j, trackerState[j.url] || {})).join('')}
              </div>
            </div>
          </div>
        `;
      }
    } else {
      // High-Density Table List View (HF-040)
      html += `
        <div class="table-view-container">
          <table class="jobs-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role &amp; Stack</th>
                <th>Region</th>
                <th>Location</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(j => renderTableRow(j, trackerState[j.url] || {})).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    container.innerHTML = html;
    bindJobEvents();
  }

  // 13. Drawer and Keyboard Bindings
  function setupDrawerEvents(): void {
    const overlay = document.getElementById('drawer-overlay');
    const closeBtn = document.getElementById('drawer-close');
    if (overlay) overlay.addEventListener('click', closeDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDrawer();
      if (e.key === '/' && document.activeElement !== document.getElementById('search-input')) {
        e.preventDefault();
        const search = document.getElementById('search-input');
        if (search) search.focus();
      }
    });

    const drawerSave = document.getElementById('drawer-save-btn');
    const drawerApplied = document.getElementById('drawer-applied-btn');
    if (drawerSave) {
      drawerSave.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeDrawerJob) toggleAction(activeDrawerJob.url, 'save');
      });
    }
    if (drawerApplied) {
      drawerApplied.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activeDrawerJob) toggleAction(activeDrawerJob.url, 'applied');
      });
    }
  }

  // 14. Toolbar and Filter Controls Bindings
  function setupControls(): void {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function (this: HTMLInputElement) {
        searchQuery = this.value;
        render();
      });
    }

    // View Mode Switcher
    document.querySelectorAll('#view-mode-toggle button').forEach(btn => {
      btn.addEventListener('click', function (this: HTMLButtonElement) {
        document.querySelectorAll('#view-mode-toggle button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentViewMode = this.getAttribute('data-view') || 'grid';
        localStorage.setItem(VIEW_KEY, currentViewMode);
        render();
      });
    });
    if (currentViewMode === 'table') {
      document.querySelectorAll('#view-mode-toggle button').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-view') === 'table');
      });
    }

    // Profile Tab Strip (Option 2: Scalable Tab Strip)
    document.querySelectorAll('#profile-tabs-strip button, #profile-filters button').forEach(btn => {
      btn.addEventListener('click', function (this: HTMLButtonElement) {
        document.querySelectorAll('#profile-tabs-strip button, #profile-filters button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedProfile = this.getAttribute('data-profile') || 'all';
        render();
      });
    });

    // Status Filter Chips
    document.querySelectorAll('#status-filters button').forEach(btn => {
      btn.addEventListener('click', function (this: HTMLButtonElement) {
        document.querySelectorAll('#status-filters button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedStatus = this.getAttribute('data-status') || 'all';
        render();
      });
    });

    // Tier Filter Chips
    document.querySelectorAll('#tier-filters button').forEach(btn => {
      btn.addEventListener('click', function (this: HTMLButtonElement) {
        document.querySelectorAll('#tier-filters button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedTier = this.getAttribute('data-tier') || 'all';
        render();
      });
    });

    // Date / Timeline Filter Chips
    document.querySelectorAll('#date-filters button, #date-and-tier-filters button[data-date]').forEach(btn => {
      btn.addEventListener('click', function (this: HTMLButtonElement) {
        document.querySelectorAll('#date-filters button, #date-and-tier-filters button[data-date]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedDate = this.getAttribute('data-date') || 'all';
        render();
      });
    });

    // Reset Filters Button
    const resetBtn = document.getElementById('filter-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetAllFilters();
      });
    }
  }

  // 15. Initial Bootstrap
  initTheme();
  setupControls();
  setupDrawerEvents();
  updateMetrics();
  render();
})();
