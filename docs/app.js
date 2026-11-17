// Job Radar • Client Application Controller (TypeScript)
// Handles theme, view switcher, search, filters, drawer, metrics, and bookmark actions

                   
             
                
                  
                   
              
                  
                  
                       
                               
                     
                            
                     
                     
 

                       
             
               
                      
                    
 

                         
                     
                          
                         
 

                        
                  
                    
 

;                                                

(function () {
  // 1. Parse Embedded Bootstrap Data
  let portalData                = { allJobs: [], profiles: [], totalJobsCount: 0 };
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

  function getTrackerState()               {
    try {
      const raw = localStorage.getItem(TRACKER_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function setTrackerState(state              )       {
    try {
      localStorage.setItem(TRACKER_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  // 3. Branded Company Monograms (Deterministic Color Generator)
  const MONOGRAM_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6'
  ];

  function getMonogramColor(company        )         {
    if (!company) return MONOGRAM_COLORS[0];
    let hash = 0;
    for (let i = 0; i < company.length; i++) {
      hash = company.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % MONOGRAM_COLORS.length;
    return MONOGRAM_COLORS[index];
  }

  function getInitials(name        )         {
    if (!name) return '•';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // 4. UI State
  let selectedProfile = 'all';
  let selectedStatus = 'all';
  let selectedDate = 'all';
  let selectedTier = 'all';
  let currentViewMode = localStorage.getItem(VIEW_KEY) || 'grid';
  let searchQuery = '';
  let activeDrawerJob                 = null;

  // 5. Toast Feedback System
  let toastTimer      = null;
  function showToast(message        , icon = '✨')       {
    const toast = document.getElementById('toast-notification');
    const msgElem = document.getElementById('toast-message');
    const iconElem = document.getElementById('toast-icon');
    if (!toast || !msgElem || !iconElem) return;

    msgElem.textContent = message;
    iconElem.textContent = icon;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // 6. Theme Engine
  function initTheme()       {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const toggleBtn = document.getElementById('theme-toggle');
    if (savedTheme === 'light') {
      document.body.classList.add('light');
      if (toggleBtn) toggleBtn.textContent = '☀️';
    } else {
      document.body.classList.remove('light');
      if (toggleBtn) toggleBtn.textContent = '🌙';
    }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light');
        toggleBtn.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
        showToast(isLight ? 'Switched to Light Mode' : 'Switched to Dark Mode', isLight ? '☀️' : '🌙');
      });
    }
  }

  // 7. Live KPI Summary Bar Calculations
  function updateMetrics()       {
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
  function openDrawer(job         )       {
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
    const applyLink = document.getElementById('drawer-apply-link')                            ;
    const saveBtn = document.getElementById('drawer-save-btn');
    const appliedBtn = document.getElementById('drawer-applied-btn');

    if (monogramElem) {
      monogramElem.textContent = getInitials(job.company);
      monogramElem.style.backgroundColor = getMonogramColor(job.company);
    }
    if (companyElem) companyElem.textContent = job.company;
    if (titleElem) titleElem.textContent = job.title;
    if (locationElem) locationElem.textContent = '📍 ' + (job.location || 'Location Not Specified');

    if (badgesElem) {
      const tierBadge = job.tier === 'domestic'
        ? '<span class="badge-tier-sm badge-domestic">📍 Domestic Priority</span>'
        : '<span class="badge-tier-sm badge-remote">🌐 Global Remote</span>';
      const targetBadge = job.isTargetCompany
        ? '<span class="badge-priority-target">⭐ Priority Target Company</span>'
        : '';
      const dateBadge = `<span class="date-pill" style="font-size: 11px;">🗓️ ${escapeHtml(job.dateLabel || 'Archive')}</span>`;
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
      saveBtn.textContent = status.saved ? '⭐ Saved' : '⭐ Save';
    }
    if (appliedBtn) {
      appliedBtn.classList.toggle('applied', Boolean(status.applied));
      appliedBtn.textContent = status.applied ? '✅ Applied' : '✅ Applied';
    }

    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer()       {
    const drawer = document.getElementById('job-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
    activeDrawerJob = null;
  }

  function escapeHtml(str        )         {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 9. Card and Table Markup Builders
  function renderCard(job         , status              )         {
    const isSaved = Boolean(status.saved);
    const isApplied = Boolean(status.applied);
    const monogramColor = getMonogramColor(job.company);
    const initials = getInitials(job.company);

    const tierBadge = job.tier === 'domestic'
      ? '<span class="badge-tier-sm badge-domestic">📍 Domestic Priority</span>'
      : '<span class="badge-tier-sm badge-remote">🌐 Global Remote</span>';
    const targetBadge = job.isTargetCompany
      ? '<span class="badge-priority-target">⭐ Priority Target</span>'
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
              <div class="card-location">📍 ${escapeHtml(job.location)}</div>
            </div>
          </div>
          <div class="card-skills-wrap">
            ${skillsHtml}
          </div>
        </div>
        <div class="card-footer" onclick="event.stopPropagation();">
          <div class="card-action-group">
            <button type="button" class="action-icon-btn ${isSaved ? 'saved' : ''}" data-action="save" onclick="event.stopPropagation();">
              ⭐ ${isSaved ? 'Saved' : 'Save'}
            </button>
            <button type="button" class="action-icon-btn ${isApplied ? 'applied' : ''}" data-action="applied" onclick="event.stopPropagation();">
              ✅ ${isApplied ? 'Applied' : 'Applied'}
            </button>
          </div>
          <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="btn-apply-cta" onclick="event.stopPropagation();">
            Apply Now ↗
          </a>
        </div>
      </div>
    `;
  }

  function renderTableRow(job         , status              )         {
    const isSaved = Boolean(status.saved);
    const isApplied = Boolean(status.applied);
    const monogramColor = getMonogramColor(job.company);
    const initials = getInitials(job.company);

    const tierBadge = job.tier === 'domestic'
      ? '<span class="badge-tier-sm badge-domestic">📍 Domestic</span>'
      : '<span class="badge-tier-sm badge-remote">🌐 Remote</span>';

    return `
      <tr data-url="${escapeHtml(job.url)}">
        <td>
          <div class="table-company-cell">
            <div class="monogram-sm" style="background-color: ${monogramColor};">
              ${initials}
            </div>
            <div>
              <div style="font-weight: 700; color: var(--text-main); font-size: 14px;">${escapeHtml(job.company)}</div>
              ${job.isTargetCompany ? '<span style="font-size: 11px; color: var(--amber); font-weight: 700;">⭐ Priority Target</span>' : ''}
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
        <td style="color: var(--text-dim); font-size: 13px;">📍 ${escapeHtml(job.location)}</td>
        <td class="table-action-cell" style="text-align: right;" onclick="event.stopPropagation();">
          <div class="card-action-group" style="justify-content: flex-end;">
            <button type="button" class="action-icon-btn ${isSaved ? 'saved' : ''}" data-action="save" title="Save Role" onclick="event.stopPropagation();">
              ⭐
            </button>
            <button type="button" class="action-icon-btn ${isApplied ? 'applied' : ''}" data-action="applied" title="Mark as Applied" onclick="event.stopPropagation();">
              ✅
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
  function toggleAction(url        , action                    )       {
    if (!url || !action) return;
    const state = getTrackerState();
    if (!state[url]) state[url] = { saved: false, applied: false };

    if (action === 'save') {
      state[url].saved = !state[url].saved;
      showToast(state[url].saved ? 'Saved role to bookmarks ⭐' : 'Removed from saved roles', '⭐');
    } else if (action === 'applied') {
      state[url].applied = !state[url].applied;
      showToast(state[url].applied ? 'Marked role as applied ✅' : 'Removed applied status', '✅');
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
          saveBtn.textContent = isSaved ? '⭐ Saved' : '⭐ Save';
        }
      }
      if (appliedBtn) {
        appliedBtn.classList.toggle('applied', isApplied);
        if (appliedBtn.textContent && appliedBtn.textContent.includes('Applied')) {
          appliedBtn.textContent = isApplied ? '✅ Applied' : '✅ Applied';
        }
      }
    });

    if (activeDrawerJob && activeDrawerJob.url === url) {
      const drawerSave = document.getElementById('drawer-save-btn');
      const drawerApplied = document.getElementById('drawer-applied-btn');
      if (drawerSave) {
        drawerSave.classList.toggle('saved', isSaved);
        drawerSave.textContent = isSaved ? '⭐ Saved' : '⭐ Save';
      }
      if (drawerApplied) {
        drawerApplied.classList.toggle('applied', isApplied);
        drawerApplied.textContent = isApplied ? '✅ Applied' : '✅ Applied';
      }
    }
  }

  // 11. Event Delegations & Bindings (HF-043 Guard)
  function bindJobEvents()       {
    // Card & Table Row Click -> Opens Detail Drawer ONLY when clicking card body
    document.querySelectorAll('.job-card, .jobs-table tbody tr').forEach(item => {
      item.addEventListener('click', function (e) {
        const target = e.target                      ;
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
        const action = this.getAttribute('data-action')                      ;
        if (url && (action === 'save' || action === 'applied')) {
          toggleAction(url, action);
        }
      });
    });
  }

  function updateFilterResetVisibility()       {
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

  function resetAllFilters()       {
    searchQuery = '';
    selectedProfile = 'all';
    selectedStatus = 'all';
    selectedDate = 'all';
    selectedTier = 'all';

    const searchInput = document.getElementById('search-input')                           ;
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
  function render()       {
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
          <div class="empty-icon">☀️</div>
          <h3 style="font-size: 18px; color: var(--text-main); font-weight: 700; margin-bottom: 6px;">No Matching Opportunities</h3>
          <p>Try clearing your search query or selecting "All Dates" / "All Regions".</p>
        </div>
      `;
      return;
    }

    // Group by Date Label
    const dateGroups                            = {};
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

      html += `
        <div class="date-section-block">
          <div class="date-header">
            <span class="date-pill">🗓️ ${escapeHtml(dateLabel)} (${dateJobs.length} Roles)</span>
            <div class="date-divider-line"></div>
          </div>
      `;

      if (currentViewMode === 'grid') {
        // Domestic Grid Section
        if (domesticJobs.length > 0) {
          html += `
            <div class="tier-header-bar tier-domestic">
              <div class="tier-title-wrap">
                <span>📍 Domestic &amp; Regional Priority (LinkedIn, Naukri &amp; Corporate Boards)</span>
              </div>
              <span class="tier-count-badge badge-domestic">${domesticJobs.length} Verified</span>
            </div>
            <div class="jobs-grid">
              ${domesticJobs.map(j => renderCard(j, trackerState[j.url] || {})).join('')}
            </div>
          `;
        }

        // Remote Grid Section
        if (remoteJobs.length > 0) {
          html += `
            <div class="tier-header-bar tier-remote">
              <div class="tier-title-wrap">
                <span>🌐 Curated Global &amp; Remote Opportunities</span>
              </div>
              <span class="tier-count-badge badge-remote">${remoteJobs.length} Roles</span>
            </div>
            <div class="jobs-grid">
              ${remoteJobs.map(j => renderCard(j, trackerState[j.url] || {})).join('')}
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
                ${dateJobs.map(j => renderTableRow(j, trackerState[j.url] || {})).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      html += '</div>';
    }

    container.innerHTML = html;
    bindJobEvents();
  }

  // 13. Drawer and Keyboard Bindings
  function setupDrawerEvents()       {
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
  function setupControls()       {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function (                      ) {
        searchQuery = this.value;
        render();
      });
    }

    // View Mode Switcher
    document.querySelectorAll('#view-mode-toggle button').forEach(btn => {
      btn.addEventListener('click', function (                       ) {
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
      btn.addEventListener('click', function (                       ) {
        document.querySelectorAll('#profile-tabs-strip button, #profile-filters button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedProfile = this.getAttribute('data-profile') || 'all';
        render();
      });
    });

    // Status Filter Chips
    document.querySelectorAll('#status-filters button').forEach(btn => {
      btn.addEventListener('click', function (                       ) {
        document.querySelectorAll('#status-filters button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedStatus = this.getAttribute('data-status') || 'all';
        render();
      });
    });

    // Tier Filter Chips
    document.querySelectorAll('#tier-filters button').forEach(btn => {
      btn.addEventListener('click', function (                       ) {
        document.querySelectorAll('#tier-filters button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedTier = this.getAttribute('data-tier') || 'all';
        render();
      });
    });

    // Date / Timeline Filter Chips
    document.querySelectorAll('#date-filters button, #date-and-tier-filters button[data-date]').forEach(btn => {
      btn.addEventListener('click', function (                       ) {
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
