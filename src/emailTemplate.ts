import type { Job } from './types.ts';

function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateEmailDigestHtml(
  jobs: Job[],
  profileName: string = 'Power Platform Job Radar',
  accentColor: string = '#742774',
  candidateName?: string,
  maxJobs: number = 15
): { subject: string; html: string; text: string } {
  const count = jobs.length;
  const displayName = candidateName?.trim() || 'there';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

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

  const getJobTier = (job: Job): number => {
    const isJSearch = isJSearchOrDomestic(job);
    if (isJSearch) {
      // Tier 1: Live domestic JSearch/LinkedIn/Naukri/Indeed postings (Target Companies within JSearch rank at top)
      return job.isTargetCompany ? 0 : 1;
    }
    if (job.isTargetCompany) {
      // Tier 2: Priority Target Companies from other feeds
      return 2;
    }
    // Tier 3: Generic remote boards
    return 3;
  };

  const sortedJobs = [...jobs].sort((a, b) => getJobTier(a) - getJobTier(b));

  const displayedJobs = sortedJobs.slice(0, maxJobs);
  const overflowCount = sortedJobs.length - displayedJobs.length;

  let contentHtml = '';

  if (count === 0) {
    contentHtml = `
      <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px 24px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 40px; margin-bottom: 12px;">🌟</div>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1e293b; font-weight: 700;">Hey ${escapeHtml(displayName)}, it's completely fine!</h3>
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569; line-height: 1.6;">
          No worries at all if today was a bit quiet on new postings &mdash; good opportunities take time, but your skills and hard work speak for themselves. You <strong>will</strong> find the right fit!
        </p>
        <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
          We'll keep scanning fresh feeds every morning and alert you the second an exciting role drops. Keep your head high and stay confident! 💪
        </p>
      </div>
    `;
  } else {
    const greetingHtml = `
      <!-- Motivational Greeting Card -->
      <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; border-left: 4px solid ${accentColor}; padding: 18px 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
        <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #0f172a;">
          Hey ${escapeHtml(displayName)}! 👋
        </p>
        <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
          Take a deep breath &mdash; the job hunt is a journey, but you're doing great and you will find the right role! Here are today's top curated opportunities for you:
        </p>
      </div>
    `;

    const jobCardsHtml = displayedJobs
      .map((job) => {
        const title = escapeHtml(job.title);
        const company = escapeHtml(job.company || 'Confidential Company');
        const location = escapeHtml(job.location || 'India / Remote');
        const source = escapeHtml(job.source ? job.source.toUpperCase() : 'JOB FEED');
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

        return `
        <!-- Job Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 18px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">
          <tr>
            <td style="padding: 24px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 700; color: ${accentColor}; text-transform: uppercase; letter-spacing: 0.5px;">${source}</span>${targetBadge}
                    <h3 style="margin: 6px 0 4px 0; font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.3;">${title}</h3>
                    <p style="margin: 0 0 14px 0; font-size: 14px; color: #475569; font-weight: 500;">
                      <strong style="color: #1e293b;">${company}</strong> &bull; 
                      <span style="display: inline-block; background-color: #f0fdf4; color: #166534; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; border: 1px solid #bbf7d0;">📍 ${location}</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0 16px 0;">
                    ${tagsHtml}
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${escapeHtml(job.url)}" target="_blank" style="display: inline-block; background-color: ${accentColor}; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 22px; border-radius: 8px; letter-spacing: 0.3px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);">
                      Apply Now ↗
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
      })
      .join('');

    const overflowHtml =
      overflowCount > 0
        ? `
      <!-- Overflow Summary Card -->
      <div style="background-color: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1; padding: 18px 20px; text-align: center; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #475569; font-weight: 600;">
          ⚡ +${overflowCount} additional ${overflowCount === 1 ? 'role' : 'roles'} identified today &bull; Top ${displayedJobs.length} priority matches displayed above
        </p>
      </div>`
        : '';

    contentHtml = `${greetingHtml}\n${jobCardsHtml}\n${overflowHtml}`;
  }

  let text = '';
  if (count === 0) {
    text = `⚡ Daily Morning Dispatch • ${profileName}\n\nHey ${displayName}, it's completely fine!\nNo worries at all if today was a bit quiet on new postings — good opportunities take time, but your skills and hard work speak for themselves. You will find the right fit!\n\nWe'll keep scanning fresh feeds every morning and alert you the second an exciting role drops. Keep your head high and stay confident!\n\nCurated with care • Stay confident and keep going! ✨`;
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

    text = `⚡ Daily Morning Dispatch • ${profileName}\n\nHey ${displayName}! Take a deep breath — the job hunt is a journey, but you're doing great and you will find the right role!\nHere are today's ${count} curated opportunities:\n\n${jobLines}${overflowText}\n\nCurated with care • Stay confident and keep going! ✨\nCustom job alerts for ${displayName} • Delivered every morning`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px;">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, ${accentColor} 0%, #0f172a 100%); border-radius: 14px 14px 0 0; padding: 32px 28px; text-align: left; color: #ffffff;">
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                ⚡ Daily Morning Dispatch
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ${escapeHtml(profileName)}
              </h1>
              <p style="margin: 0; font-size: 14px; color: #e2e8f0; font-weight: 500;">
                ${count} fresh role${count === 1 ? '' : 's'} identified for India &bull; ${today}
              </p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 0;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 20px; text-align: center; color: #64748b; font-size: 13px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">
                Curated with care &bull; Stay confident and keep going! ✨
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Custom job alerts for ${escapeHtml(displayName)} &bull; Delivered every morning
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
