import type { Job } from '../types.ts';
import { loadEmailTemplate, getTemplateSnippet, renderTemplate } from './templateLoader.ts';

export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderJobCard(job: Job, accentColor: string): string {
  const targetBadge = job.isTargetCompany
    ? `<span style="display: inline-block; background-color: #fef08a; color: #854d0e; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; border: 1px solid #fde047; margin-left: 8px;">⭐ Priority Target</span>`
    : '';

  const tagsHtml = job.tags
    .map(
      (tag) => `
    <span style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; margin-right: 6px; margin-bottom: 6px; border: 1px solid #e2e8f0;">
      ${escapeHtml(tag)}
    </span>`
    )
    .join('');

  return renderTemplate(getTemplateSnippet('jobCard'), {
    accentColor,
    source: escapeHtml(job.source ? job.source.toUpperCase() : 'JOB FEED'),
    targetBadge,
    title: escapeHtml(job.title),
    company: escapeHtml(job.company || 'Confidential Company'),
    location: escapeHtml(job.location || 'India / Remote'),
    tagsHtml,
    url: escapeHtml(job.url)
  });
}

function renderSectionHeader(
  title: string,
  subtitle: string,
  icon: string,
  badgeText: string,
  badgeColor: string,
  badgeBg: string
): string {
  return renderTemplate(getTemplateSnippet('sectionHeader'), {
    icon,
    title: escapeHtml(title),
    badgeBg,
    badgeColor,
    badgeText: escapeHtml(badgeText),
    subtitle: escapeHtml(subtitle)
  });
}

export function generateEmailDigestHtml(
  jobs: Job[],
  profileName: string = 'Power Platform Job Radar',
  accentColor: string = '#742774',
  candidateName?: string,
  maxJobs: number = 15
): { subject: string; html: string; text: string; displayedJobs: Job[] } {
  const count = jobs.length;
  const displayName = candidateName?.trim() || 'there';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const isEvening = new Date().getUTCHours() >= 10;
  const dispatchEdition = isEvening ? 'Daily Evening Dispatch' : 'Daily Morning Dispatch';

  const subject =
    count === 1
      ? `✨ ${profileName} • 1 New Role Found Today`
      : `✨ ${profileName} • ${count} New Roles Found Today`;

  const isJSearchOrDomestic = (job: Job): boolean => {
    const src = (job.source || '').toLowerCase();
    const id = (job.id || '').toLowerCase();
    return (
      id.startsWith('jsearch') ||
      src === 'linkedin' ||
      src === 'naukri' ||
      src === 'indeed' ||
      src === 'glassdoor' ||
      src === 'jsearch' ||
      src === 'adzuna'
    );
  };

  const sortComparator = (a: Job, b: Job): number => {
    // 1. Target company first
    const aTarget = a.isTargetCompany ? 0 : 1;
    const bTarget = b.isTargetCompany ? 0 : 1;
    if (aTarget !== bTarget) return aTarget - bTarget;

    // 2. Freshness first: newest scraped_at timestamp first
    const aTime = a.scrapedAt ? new Date(a.scrapedAt).getTime() : 0;
    const bTime = b.scrapedAt ? new Date(b.scrapedAt).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;

    return 0;
  };

  const allDomestic = jobs.filter(isJSearchOrDomestic).sort(sortComparator);
  const allRemote = jobs.filter((j) => !isJSearchOrDomestic(j)).sort(sortComparator);

  const maxDomesticAllotment = Math.max(0, maxJobs - 3); // e.g. 12
  let domesticCount = Math.min(allDomestic.length, maxDomesticAllotment);
  let remoteSlotsRemaining = maxJobs - domesticCount;
  let remoteCount = Math.min(allRemote.length, remoteSlotsRemaining);

  // If remote didn't fill its quota, allow domestic to take the remaining slots
  if (remoteCount < remoteSlotsRemaining && allDomestic.length > domesticCount) {
    domesticCount = Math.min(allDomestic.length, maxJobs - remoteCount);
  }

  const displayedDomestic = allDomestic.slice(0, domesticCount);
  const displayedRemote = allRemote.slice(0, remoteCount);
  const displayedJobs = [...displayedDomestic, ...displayedRemote];
  const overflowCount = jobs.length - displayedJobs.length;
  const portalUrl = escapeHtml(process.env.PORTAL_URL || 'https://vishnu1562.github.io/Job_Bot/');

  let contentHtml = '';

  if (count === 0) {
    contentHtml = renderTemplate(getTemplateSnippet('emptyState'), {
      displayName: escapeHtml(displayName),
      portalUrl
    });
  } else {
    const greetingHtml = renderTemplate(getTemplateSnippet('greetingCard'), {
      displayName: escapeHtml(displayName),
      accentColor,
      portalUrl
    });

    let sectionsHtml = '';

    if (displayedDomestic.length > 0) {
      const domesticCards = displayedDomestic.map((j) => renderJobCard(j, accentColor)).join('');
      const header = renderSectionHeader(
        'Domestic & Regional Priority (LinkedIn, Naukri & Corporate Boards)',
        'Direct openings from Indian IT hubs & regional offices',
        '📍',
        `${displayedDomestic.length} Verified`,
        '#166534',
        '#dcfce7'
      );
      sectionsHtml += `${header}\n${domesticCards}\n`;
    }

    if (displayedRemote.length > 0) {
      const remoteCards = displayedRemote.map((j) => renderJobCard(j, accentColor)).join('');
      const header = renderSectionHeader(
        'Curated Global & Remote Opportunities',
        'Worldwide remote engineering roles open to candidates from India',
        '🌐',
        `${displayedRemote.length} Roles`,
        '#1e40af',
        '#dbeafe'
      );
      sectionsHtml += `${header}\n${remoteCards}\n`;
    }

    const overflowHtml =
      overflowCount > 0
        ? renderTemplate(getTemplateSnippet('overflowCard'), {
            overflowCount,
            roleWord: overflowCount === 1 ? 'role' : 'roles',
            displayedCount: displayedJobs.length,
            portalUrl
          })
        : '';

    contentHtml = `${greetingHtml}\n${sectionsHtml}${overflowHtml}`;
  }

  let text = '';
  if (count === 0) {
    text = `⚡ ${dispatchEdition} • ${profileName}\n\nHey ${displayName}, it's completely fine!\nNo worries at all if today was a bit quiet on new postings — good opportunities take time, but your skills and hard work speak for themselves. You will find the right fit!\n\nWe'll keep scanning fresh feeds every day and alert you the second an exciting role drops. Keep your head high and stay confident!\n\nCurated with care • Stay confident and keep going! ✨`;
  } else {
    const jobLines = displayedJobs
      .map((j, idx) => {
        const priorityLabel = j.isTargetCompany ? ' [⭐ Priority Target]' : '';
        return `${idx + 1}. ${j.title} (${j.company})${priorityLabel}\n   Location: ${j.location}\n   Tags: ${j.tags.join(' ')}\n   Apply: ${j.url}`;
      })
      .join('\n\n');

    const overflowText =
      overflowCount > 0
        ? `\n\n+ ${overflowCount} additional role(s) identified today • Top ${displayedJobs.length} priority matches displayed above`
        : '';

    text = `⚡ ${dispatchEdition} • ${profileName}\n\nHey ${displayName}! Take a deep breath — the job hunt is a journey, but you're doing great and you will find the right role!\nHere are today's ${count} curated opportunities:\n\n${jobLines}${overflowText}\n\nCurated with care • Stay confident and keep going! ✨\nCustom job alerts for ${displayName} • Delivered daily`;
  }

  const html = renderTemplate(loadEmailTemplate(), {
    title: escapeHtml(subject),
    accentColor,
    dispatchEdition: escapeHtml(dispatchEdition),
    profileName: escapeHtml(profileName),
    count,
    pluralS: count === 1 ? '' : 's',
    today,
    content: contentHtml,
    displayName: escapeHtml(displayName)
  });

  return { subject, html, text, displayedJobs };
}
