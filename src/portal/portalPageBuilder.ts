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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Radar Portal • Modern Candidate Intelligence Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(18, 24, 38, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --card-hover-border: rgba(99, 102, 241, 0.45);
      --card-hover-glow: rgba(99, 102, 241, 0.12);
      --nav-bg: rgba(9, 13, 22, 0.85);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --primary-glow: rgba(99, 102, 241, 0.35);
      --emerald: #10b981;
      --emerald-bg: rgba(16, 185, 129, 0.12);
      --emerald-border: rgba(16, 185, 129, 0.3);
      --blue: #3b82f6;
      --blue-bg: rgba(59, 130, 246, 0.12);
      --blue-border: rgba(59, 130, 246, 0.3);
      --amber: #f59e0b;
      --amber-bg: rgba(245, 158, 11, 0.12);
      --amber-border: rgba(245, 158, 11, 0.35);
      --drawer-bg: #0f172a;
      --table-row-hover: rgba(255, 255, 255, 0.03);
    }

    body.light {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --card-hover-border: #6366f1;
      --card-hover-glow: rgba(99, 102, 241, 0.08);
      --nav-bg: rgba(255, 255, 255, 0.9);
      --text-main: #0f172a;
      --text-muted: #64748b;
      --text-dim: #94a3b8;
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --primary-glow: rgba(79, 70, 229, 0.2);
      --emerald: #059669;
      --emerald-bg: #ecfdf5;
      --emerald-border: #a7f3d0;
      --blue: #2563eb;
      --blue-bg: #eff6ff;
      --blue-border: #bfdbfe;
      --amber: #d97706;
      --amber-bg: #fffbeb;
      --amber-border: #fde68a;
      --drawer-bg: #ffffff;
      --table-row-hover: #f1f5f9;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      line-height: 1.5;
      min-height: 100vh;
      transition: background-color 0.2s ease, color 0.2s ease;
      -webkit-font-smoothing: antialiased;
    }

    /* Fixed Glass Navbar */
    .top-navbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--nav-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--card-border);
      padding: 14px 24px;
    }
    .nav-inner {
      max-width: 1300px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
    }
    .brand-logo span.gradient-text {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .live-dot-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--emerald-bg);
      color: var(--emerald);
      border: 1px solid var(--emerald-border);
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .live-pulse {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--emerald);
      box-shadow: 0 0 8px var(--emerald);
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse-ring {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.15); }
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .icon-btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;
    }
    .icon-btn:hover {
      color: var(--text-main);
      border-color: var(--primary);
      transform: translateY(-1px);
    }
    .view-mode-toggle {
      display: flex;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 3px;
    }
    .view-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
    }
    .view-btn.active {
      background: var(--primary);
      color: #fff;
      box-shadow: 0 2px 6px var(--primary-glow);
    }

    /* Hero / KPI Stats Bar */
    .hero-container {
      max-width: 1300px;
      margin: 24px auto 0;
      padding: 0 20px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: var(--card-hover-border);
    }
    .kpi-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .kpi-stat-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.1;
      letter-spacing: -0.02em;
    }
    .kpi-stat-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Controls & Filter Deck */
    .controls-deck {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.2);
    }
    .search-row {
      display: flex;
      gap: 12px;
      margin-bottom: 18px;
    }
    .search-input-wrapper {
      flex: 1;
      position: relative;
    }
    .search-input-wrapper input {
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 14px 18px 14px 44px;
      color: var(--text-main);
      font-size: 14px;
      font-weight: 500;
      outline: none;
      transition: all 0.2s ease;
    }
    .search-input-wrapper input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px;
      color: var(--text-dim);
      pointer-events: none;
    }
    .kbd-shortcut {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text-dim);
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      padding: 3px 7px;
      border-radius: 6px;
      pointer-events: none;
    }

    .filter-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
    }
    .filter-pills-row:last-child {
      margin-bottom: 0;
    }
    .filter-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
      margin-right: 4px;
      min-width: 60px;
    }
    .pill-btn {
      background: var(--bg);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 7px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .pill-btn:hover {
      color: var(--text-main);
      border-color: #64748b;
      transform: translateY(-1px);
    }
    .pill-btn.active {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
      box-shadow: 0 2px 8px var(--primary-glow);
    }

    /* Main Container */
    .content-area {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 20px 80px;
    }

    /* Date Headings & Tier Section Dividers */
    .date-section-block {
      margin-bottom: 40px;
    }
    .date-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .date-pill {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
      border: 1px solid rgba(99, 102, 241, 0.35);
      color: var(--text-main);
      font-size: 13px;
      font-weight: 800;
      padding: 6px 16px;
      border-radius: 24px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .date-divider-line {
      flex: 1;
      height: 1px;
      background: var(--card-border);
    }

    .tier-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-radius: 12px;
      margin: 20px 0 14px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
    }
    .tier-title-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
    }
    .tier-domestic .tier-title-wrap { color: var(--emerald); }
    .tier-remote .tier-title-wrap { color: var(--blue); }
    .tier-count-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 12px;
    }
    .badge-domestic { background: var(--emerald-bg); color: var(--emerald); border: 1px solid var(--emerald-border); }
    .badge-remote { background: var(--blue-bg); color: var(--blue); border: 1px solid var(--blue-border); }

    /* Grid Layout: Modern Interactive Cards */
    .jobs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 18px;
    }
    .job-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s, box-shadow 0.2s;
    }
    .job-card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.4), transparent);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .job-card:hover {
      transform: translateY(-3px);
      border-color: var(--card-hover-border);
      box-shadow: 0 12px 28px -8px var(--card-hover-glow);
    }
    .job-card:hover::before {
      opacity: 1;
    }

    .card-top {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 14px;
    }
    /* Monogram Avatar */
    .company-monogram {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      letter-spacing: -0.02em;
      color: #ffffff;
      flex-shrink: 0;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }
    .card-header-content {
      flex: 1;
      min-width: 0;
    }
    .card-badges-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      flex-wrap: wrap;
    }
    .badge-tier-sm {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 6px;
      letter-spacing: 0.03em;
    }
    .badge-priority-target {
      background: var(--amber-bg);
      color: var(--amber);
      border: 1px solid var(--amber-border);
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 3px;
      line-height: 1.35;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .card-company {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 2px;
    }
    .card-location {
      font-size: 12px;
      color: var(--text-dim);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .card-skills-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 14px 0 16px;
    }
    .skill-tag-pill {
      background: var(--bg);
      color: var(--text-muted);
      border: 1px solid var(--card-border);
      font-size: 11px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 20px;
      transition: all 0.15s;
    }
    .skill-tag-pill:hover {
      color: var(--text-main);
      border-color: #64748b;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 14px;
      border-top: 1px solid var(--card-border);
    }
    .card-action-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .action-icon-btn {
      background: var(--bg);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s;
    }
    .action-icon-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
      border-color: #64748b;
    }
    .action-icon-btn.saved {
      background: var(--amber-bg);
      color: var(--amber);
      border-color: var(--amber-border);
    }
    .action-icon-btn.applied {
      background: var(--emerald-bg);
      color: var(--emerald);
      border-color: var(--emerald-border);
    }
    .btn-apply-cta {
      background: var(--primary);
      color: #ffffff;
      text-decoration: none;
      padding: 7px 15px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s;
      box-shadow: 0 2px 6px var(--primary-glow);
    }
    .btn-apply-cta:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }

    /* Table View Format */
    .table-view-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.2);
    }
    .jobs-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .jobs-table th {
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid var(--card-border);
      padding: 14px 18px;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .jobs-table td {
      padding: 14px 18px;
      border-bottom: 1px solid var(--card-border);
      font-size: 13px;
      vertical-align: middle;
      transition: background 0.15s;
    }
    .jobs-table tr:hover td {
      background: var(--table-row-hover);
      cursor: pointer;
    }
    .table-company-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .monogram-sm {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }

    /* Slide-Over Detail Drawer (HF-039) */
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 100;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    .drawer-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    .job-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 580px;
      background: var(--drawer-bg);
      border-left: 1px solid var(--card-border);
      z-index: 101;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
    }
    .job-drawer.open {
      transform: translateX(0);
    }
    .drawer-header {
      padding: 24px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .drawer-close-btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.15s;
    }
    .drawer-close-btn:hover {
      color: var(--text-main);
      border-color: #64748b;
    }
    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
    .drawer-desc {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.7;
      margin-top: 20px;
      white-space: pre-line;
    }
    .drawer-footer {
      padding: 20px 24px;
      border-top: 1px solid var(--card-border);
      background: var(--card-bg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    /* Floating Toast Notification (HF-041) */
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 150;
      pointer-events: none;
    }
    .toast-pill {
      background: #1e293b;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 30px;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      transform: translateY(40px);
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .toast-pill.show {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    /* Empty state */
    .empty-state {
      background: var(--card-bg);
      border: 1px dashed var(--card-border);
      border-radius: 20px;
      padding: 60px 24px;
      text-align: center;
      color: var(--text-muted);
      margin: 40px 0;
    }
    .empty-icon { font-size: 48px; margin-bottom: 14px; }

    @media (max-width: 640px) {
      .jobs-grid { grid-template-columns: 1fr; }
      .nav-inner { flex-direction: column; align-items: stretch; }
      .nav-actions { justify-content: space-between; }
      .job-drawer { max-width: 100%; }
      .search-row { flex-direction: column; }
    }
  </style>
</head>
<body>
  <!-- Top Glass Navigation -->
  <header class="top-navbar">
    <div class="nav-inner">
      <div class="brand-group">
        <a href="#" class="brand-logo">
          ⚡ <span class="gradient-text">Job Radar Portal</span>
        </a>
        <div class="live-dot-badge">
          <span class="live-pulse"></span>
          Live Feed
        </div>
      </div>
      <div class="nav-actions">
        <!-- Grid vs Table View Mode (HF-040) -->
        <div class="view-mode-toggle" id="view-mode-toggle">
          <button class="view-btn active" data-view="grid">▦ Grid</button>
          <button class="view-btn" data-view="table">≡ Table</button>
        </div>
        <!-- Dark / Light Theme Toggle (HF-038) -->
        <button class="icon-btn" id="theme-toggle" title="Toggle Light / Dark Mode" data-action="toggle-theme">
          🌙
        </button>
      </div>
    </div>
  </header>

  <!-- Hero & Live KPI Summary Bar (HF-038) -->
  <div class="hero-container" id="app">
    <!-- @portal:app -->
    <div class="kpi-grid" id="kpi-stats-bar">
      <div class="kpi-card">
        <div class="kpi-icon-wrap" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">
          📊
        </div>
        <div>
          <div class="kpi-stat-value" id="kpi-total-jobs">${data.totalJobsCount}</div>
          <div class="kpi-stat-label">Total Active Roles</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon-wrap" style="background: rgba(244, 63, 94, 0.15); color: #fb7185;">
          🔥
        </div>
        <div>
          <div class="kpi-stat-value" id="kpi-today-jobs">0</div>
          <div class="kpi-stat-label">New in Today's Batch</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon-wrap" style="background: var(--emerald-bg); color: var(--emerald);">
          📍
        </div>
        <div>
          <div class="kpi-stat-value" id="kpi-domestic-jobs">0</div>
          <div class="kpi-stat-label">Domestic Priority</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon-wrap" style="background: var(--amber-bg); color: var(--amber);">
          ⭐
        </div>
        <div>
          <div class="kpi-stat-value" id="kpi-saved-jobs">0</div>
          <div class="kpi-stat-label">My Saved Roles</div>
        </div>
      </div>
    </div>

    <!-- Controls & Multi-Filters -->
    <div class="controls-deck">
      <!-- Search Input -->
      <div class="search-row">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" id="search-input" placeholder="Search by title, company, skills, or city...">
          <span class="kbd-shortcut">/</span>
        </div>
      </div>

      <!-- Profile Segmented Pills -->
      <div class="filter-pills-row" id="profile-filters">
        <span class="filter-label">Profile:</span>
        <button class="pill-btn active" data-profile="all">All Roles (${data.totalJobsCount})</button>
        ${data.profiles
          .map(
            (p) => `
          <button class="pill-btn" data-profile="${escapeHtml(p.id)}">
            ${escapeHtml(p.name)} (${p.jobsCount})
          </button>`
          )
          .join('')}
      </div>

      <!-- Candidate Status Tracker Filters -->
      <div class="filter-pills-row" id="status-filters">
        <span class="filter-label">Status:</span>
        <button class="pill-btn active" data-status="all">All Active</button>
        <button class="pill-btn" data-status="saved">⭐ Saved (<span id="status-saved-badge">0</span>)</button>
        <button class="pill-btn" data-status="applied">✅ Applied (<span id="status-applied-badge">0</span>)</button>
      </div>

      <!-- Secondary Filters: Date & Tier -->
      <div class="filter-pills-row" id="date-and-tier-filters">
        <span class="filter-label">Timeline:</span>
        <button class="pill-btn active" data-date="all">All Dates</button>
        <button class="pill-btn" data-date="today">Today's Batch</button>
        <button class="pill-btn" data-date="yesterday">Yesterday</button>

        <span class="filter-label" style="margin-left: 12px;">Tier:</span>
        <button class="pill-btn active" data-tier="all">All Tiers</button>
        <button class="pill-btn" data-tier="domestic">📍 Domestic Priority</button>
        <button class="pill-btn" data-tier="remote">🌐 Global Remote</button>
      </div>
    </div>
  </div>

  <!-- Main Feed Area -->
  <main class="content-area" id="listings-container">
    <!-- Injected dynamically by JavaScript -->
  </main>

  <!-- Slide-Over Job Detail Drawer (HF-039) -->
  <div class="drawer-overlay" id="drawer-overlay"></div>
  <aside class="job-drawer" id="job-drawer">
    <div class="drawer-header">
      <div class="table-company-cell">
        <div class="monogram-sm" id="drawer-company-monogram">C</div>
        <div>
          <div id="drawer-company" style="font-size: 13px; font-weight: 700; color: var(--text-muted);">Company</div>
          <h2 id="drawer-title" style="font-size: 18px; font-weight: 800; color: var(--text-main); line-height: 1.3;">Job Title</h2>
        </div>
      </div>
      <button class="drawer-close-btn" id="drawer-close" title="Close Drawer (Esc)">✕</button>
    </div>
    <div class="drawer-body">
      <div id="drawer-badges" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px;"></div>
      <div id="drawer-location" style="font-size: 13px; color: var(--text-dim); display: flex; align-items: center; gap: 6px;"></div>
      <div id="drawer-skills" style="display: flex; flex-wrap: wrap; gap: 6px; margin: 16px 0;"></div>
      <div class="drawer-desc" id="drawer-description"></div>
    </div>
    <div class="drawer-footer">
      <div class="card-action-group">
        <button class="action-icon-btn" id="drawer-save-btn" data-action="save">⭐ Save</button>
        <button class="action-icon-btn" id="drawer-applied-btn" data-action="applied">✅ Applied</button>
      </div>
      <a href="#" target="_blank" rel="noopener noreferrer" class="btn-apply-cta" id="drawer-apply-link">
        Apply Now ↗
      </a>
    </div>
  </aside>

  <!-- Toast Container (HF-041) -->
  <div class="toast-container">
    <div class="toast-pill" id="toast-notification">
      <span id="toast-icon">✨</span>
      <span id="toast-message">Action saved</span>
    </div>
  </div>

  <!-- Embedded JSON Bootstrap for Offline & Local File Fallback (EC-021) -->
  <script id="portal-data" type="application/json">
${jsonString}
  </script>

  <script>
    (function() {
      // 1. Parse Embedded Bootstrap Data
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

      // 2. LocalStorage Persistence Helpers
      const TRACKER_KEY = 'job_radar_tracker_v1';
      const THEME_KEY = 'job_radar_theme';
      const VIEW_KEY = 'job_radar_view_mode';

      function getTrackerState() {
        try {
          const raw = localStorage.getItem(TRACKER_KEY);
          return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
      }
      function setTrackerState(state) {
        try { localStorage.setItem(TRACKER_KEY, JSON.stringify(state)); } catch (e) {}
      }

      // 3. Branded Company Monograms (Deterministic Color Generator)
      const MONOGRAM_COLORS = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
        '#eab308', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6'
      ];
      function getMonogramColor(company) {
        if (!company) return MONOGRAM_COLORS[0];
        let hash = 0;
        for (let i = 0; i < company.length; i++) {
          hash = company.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % MONOGRAM_COLORS.length;
        return MONOGRAM_COLORS[index];
      }
      function getInitials(name) {
        if (!name) return '•';
        const parts = name.trim().split(/\\s+/);
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
      let activeDrawerJob = null;

      // 5. Toast System
      let toastTimer = null;
      function showToast(message, icon = '✨') {
        const toast = document.getElementById('toast-notification');
        const msgElem = document.getElementById('toast-message');
        const iconElem = document.getElementById('toast-icon');
        if (!toast) return;

        msgElem.textContent = message;
        iconElem.textContent = icon;
        toast.classList.add('show');

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          toast.classList.remove('show');
        }, 2500);
      }

      // 6. Theme Engine
      function initTheme() {
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

      // 7. Live KPI & Counter Updates
      function updateMetrics() {
        const tracker = getTrackerState();
        let savedCount = 0;
        let appliedCount = 0;
        for (const k in tracker) {
          if (tracker[k].saved) savedCount++;
          if (tracker[k].applied) appliedCount++;
        }

        const savedBadge = document.getElementById('status-saved-badge');
        const appliedBadge = document.getElementById('status-applied-badge');
        const kpiSaved = document.getElementById('kpi-saved-jobs');
        if (savedBadge) savedBadge.textContent = savedCount;
        if (appliedBadge) appliedBadge.textContent = appliedCount;
        if (kpiSaved) kpiSaved.textContent = savedCount;

        const todayJobsCount = portalData.allJobs.filter(j => j.dateLabel === "Today's Batch").length;
        const domesticJobsCount = portalData.allJobs.filter(j => j.tier === 'domestic').length;

        const kpiToday = document.getElementById('kpi-today-jobs');
        const kpiDomestic = document.getElementById('kpi-domestic-jobs');
        if (kpiToday) kpiToday.textContent = todayJobsCount;
        if (kpiDomestic) kpiDomestic.textContent = domesticJobsCount;
      }

      // 8. Slide-Over Detail Drawer Helpers
      function openDrawer(job) {
        activeDrawerJob = job;
        const drawer = document.getElementById('job-drawer');
        const overlay = document.getElementById('drawer-overlay');
        if (!drawer || !overlay) return;

        const monogram = document.getElementById('drawer-company-monogram');
        const titleElem = document.getElementById('drawer-title');
        const companyElem = document.getElementById('drawer-company');
        const locationElem = document.getElementById('drawer-location');
        const badgesElem = document.getElementById('drawer-badges');
        const skillsElem = document.getElementById('drawer-skills');
        const descElem = document.getElementById('drawer-description');
        const applyLink = document.getElementById('drawer-apply-link');
        const saveBtn = document.getElementById('drawer-save-btn');
        const appliedBtn = document.getElementById('drawer-applied-btn');

        monogram.style.backgroundColor = getMonogramColor(job.company);
        monogram.textContent = getInitials(job.company);
        titleElem.textContent = job.title;
        companyElem.textContent = job.company;
        locationElem.innerHTML = '📍 ' + escapeHtml(job.location) + ' &bull; Scraped ' + escapeHtml(job.dateLabel || 'Recently');

        const tierBadge = job.tier === 'domestic'
          ? '<span class="badge-tier-sm badge-domestic">📍 Domestic Priority</span>'
          : '<span class="badge-tier-sm badge-remote">🌐 Global Remote</span>';
        const targetBadge = job.isTargetCompany ? '<span class="badge-priority-target">⭐ Priority Target</span>' : '';
        badgesElem.innerHTML = tierBadge + targetBadge;

        skillsElem.innerHTML = (job.tags || []).map(t => '<span class="skill-tag-pill">' + escapeHtml(t) + '</span>').join('');
        descElem.textContent = job.description || 'No extended description provided. Click "Apply Now" to view full listing.';

        applyLink.href = job.url;

        const state = getTrackerState()[job.url] || {};
        saveBtn.classList.toggle('saved', Boolean(state.saved));
        saveBtn.textContent = state.saved ? '⭐ Saved' : '⭐ Save';

        appliedBtn.classList.toggle('applied', Boolean(state.applied));
        appliedBtn.textContent = state.applied ? '✅ Applied' : '✅ Applied';

        drawer.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      }

      function closeDrawer() {
        const drawer = document.getElementById('job-drawer');
        const overlay = document.getElementById('drawer-overlay');
        if (drawer) drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
      }

      // 9. Main Rendering Engine
      function render() {
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
          container.innerHTML = \`
            <div class="empty-state">
              <div class="empty-icon">☀️</div>
              <h3 style="font-size: 18px; color: var(--text-main); font-weight: 700; margin-bottom: 6px;">No Matching Opportunities</h3>
              <p>Try clearing your search query or selecting "All Dates" / "All Tiers".</p>
            </div>
          \`;
          return;
        }

        // Group by Date Label
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
            <div class="date-section-block">
              <div class="date-header">
                <span class="date-pill">🗓️ \${escapeHtml(dateLabel)} (\${dateJobs.length} Roles)</span>
                <div class="date-divider-line"></div>
              </div>
          \`;

          if (currentViewMode === 'grid') {
            // Domestic Grid Section
            if (domesticJobs.length > 0) {
              html += \`
                <div class="tier-header-bar tier-domestic">
                  <div class="tier-title-wrap">
                    <span>📍 Domestic &amp; Regional Priority (LinkedIn, Naukri &amp; Corporate Boards)</span>
                  </div>
                  <span class="tier-count-badge badge-domestic">\${domesticJobs.length} Verified</span>
                </div>
                <div class="jobs-grid">
                  \${domesticJobs.map(j => renderCard(j, trackerState[j.url] || {})).join('')}
                </div>
              \`;
            }

            // Remote Grid Section
            if (remoteJobs.length > 0) {
              html += \`
                <div class="tier-header-bar tier-remote">
                  <div class="tier-title-wrap">
                    <span>🌐 Curated Global &amp; Remote Opportunities</span>
                  </div>
                  <span class="tier-count-badge badge-remote">\${remoteJobs.length} Roles</span>
                </div>
                <div class="jobs-grid">
                  \${remoteJobs.map(j => renderCard(j, trackerState[j.url] || {})).join('')}
                </div>
              \`;
            }
          } else {
            // High-Density Table List View (HF-040)
            html += \`
              <div class="table-view-container">
                <table class="jobs-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Role &amp; Stack</th>
                      <th>Tier</th>
                      <th>Location</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${dateJobs.map(j => renderTableRow(j, trackerState[j.url] || {})).join('')}
                  </tbody>
                </table>
              </div>
            \`;
          }

          html += '</div>';
        }

        container.innerHTML = html;
        bindJobEvents();
      }

      function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      function renderCard(job, status) {
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

        return \`
          <div class="job-card" data-url="\${escapeHtml(job.url)}">
            <div>
              <div class="card-top">
                <div class="company-monogram" style="background-color: \${monogramColor};">
                  \${initials}
                </div>
                <div class="card-header-content">
                  <div class="card-badges-row">
                    \${tierBadge}
                    \${targetBadge}
                  </div>
                  <h3 class="card-title">\${escapeHtml(job.title)}</h3>
                  <div class="card-company">\${escapeHtml(job.company)}</div>
                  <div class="card-location">📍 \${escapeHtml(job.location)}</div>
                </div>
              </div>
              <div class="card-skills-wrap">
                \${skillsHtml}
              </div>
            </div>
            <div class="card-footer">
              <div class="card-action-group">
                <button class="action-icon-btn \${isSaved ? 'saved' : ''}" data-action="save">
                  ⭐ \${isSaved ? 'Saved' : 'Save'}
                </button>
                <button class="action-icon-btn \${isApplied ? 'applied' : ''}" data-action="applied">
                  ✅ \${isApplied ? 'Applied' : 'Applied'}
                </button>
              </div>
              <a href="\${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="btn-apply-cta" onclick="event.stopPropagation();">
                Apply Now ↗
              </a>
            </div>
          </div>
        \`;
      }

      function renderTableRow(job, status) {
        const isSaved = Boolean(status.saved);
        const isApplied = Boolean(status.applied);
        const monogramColor = getMonogramColor(job.company);
        const initials = getInitials(job.company);

        const tierBadge = job.tier === 'domestic'
          ? '<span class="badge-tier-sm badge-domestic">📍 Domestic</span>'
          : '<span class="badge-tier-sm badge-remote">🌐 Remote</span>';

        return \`
          <tr data-url="\${escapeHtml(job.url)}">
            <td>
              <div class="table-company-cell">
                <div class="monogram-sm" style="background-color: \${monogramColor};">
                  \${initials}
                </div>
                <strong>\${escapeHtml(job.company)}</strong>
              </div>
            </td>
            <td>
              <div style="font-weight: 700; color: var(--text-main);">\${escapeHtml(job.title)}</div>
              <div style="font-size: 11px; color: var(--text-dim);">\${(job.tags || []).join(' ')}</div>
            </td>
            <td>\${tierBadge}</td>
            <td style="color: var(--text-muted); font-size: 12px;">📍 \${escapeHtml(job.location)}</td>
            <td style="text-align: right;">
              <div class="card-action-group" style="justify-content: flex-end;">
                <button class="action-icon-btn \${isSaved ? 'saved' : ''}" data-action="save" onclick="event.stopPropagation();">
                  ⭐
                </button>
                <button class="action-icon-btn \${isApplied ? 'applied' : ''}" data-action="applied" onclick="event.stopPropagation();">
                  ✅
                </button>
                <a href="\${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="btn-apply-cta" onclick="event.stopPropagation();">
                  Apply ↗
                </a>
              </div>
            </td>
          </tr>
        \`;
      }

      function bindJobEvents() {
        // Card click -> Open Slide-Over Drawer
        document.querySelectorAll('.job-card, .jobs-table tbody tr').forEach(item => {
          item.addEventListener('click', function(e) {
            if (e.target.closest('a') || e.target.closest('button')) return;
            const url = this.getAttribute('data-url');
            const job = portalData.allJobs.find(j => j.url === url);
            if (job) openDrawer(job);
          });
        });

        // Inline Action Buttons (Save / Applied)
        document.querySelectorAll('.action-icon-btn').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const parent = this.closest('[data-url]');
            if (!parent) return;
            const url = parent.getAttribute('data-url');
            const action = this.getAttribute('data-action');
            toggleAction(url, action);
          });
        });
      }

      function toggleAction(url, action) {
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
        render();

        if (activeDrawerJob && activeDrawerJob.url === url) {
          openDrawer(activeDrawerJob);
        }
      }

      // Drawer Event Bindings
      function setupDrawerEvents() {
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
          drawerSave.addEventListener('click', () => {
            if (activeDrawerJob) toggleAction(activeDrawerJob.url, 'save');
          });
        }
        if (drawerApplied) {
          drawerApplied.addEventListener('click', () => {
            if (activeDrawerJob) toggleAction(activeDrawerJob.url, 'applied');
          });
        }
      }

      // Toolbar and View Controls Bindings
      function setupControls() {
        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.addEventListener('input', function() {
            searchQuery = this.value;
            render();
          });
        }

        // View Mode Switcher
        document.querySelectorAll('#view-mode-toggle button').forEach(btn => {
          btn.addEventListener('click', function() {
            document.querySelectorAll('#view-mode-toggle button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentViewMode = this.getAttribute('data-view');
            localStorage.setItem(VIEW_KEY, currentViewMode);
            render();
          });
        });
        if (currentViewMode === 'table') {
          document.querySelectorAll('#view-mode-toggle button').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-view') === 'table');
          });
        }

        // Profile Pills
        document.querySelectorAll('#profile-filters button').forEach(btn => {
          btn.addEventListener('click', function() {
            document.querySelectorAll('#profile-filters button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedProfile = this.getAttribute('data-profile');
            render();
          });
        });

        // Status Pills
        document.querySelectorAll('#status-filters button').forEach(btn => {
          btn.addEventListener('click', function() {
            document.querySelectorAll('#status-filters button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedStatus = this.getAttribute('data-status');
            render();
          });
        });

        // Date Pills
        document.querySelectorAll('#date-and-tier-filters button[data-date]').forEach(btn => {
          btn.addEventListener('click', function() {
            document.querySelectorAll('#date-and-tier-filters button[data-date]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedDate = this.getAttribute('data-date');
            render();
          });
        });

        // Tier Pills
        document.querySelectorAll('#date-and-tier-filters button[data-tier]').forEach(btn => {
          btn.addEventListener('click', function() {
            document.querySelectorAll('#date-and-tier-filters button[data-tier]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedTier = this.getAttribute('data-tier');
            render();
          });
        });
      }

      // Initial Bootstrap
      initTheme();
      setupControls();
      setupDrawerEvents();
      updateMetrics();
      render();
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
