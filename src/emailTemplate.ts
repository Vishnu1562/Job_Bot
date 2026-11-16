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

export function generateEmailDigestHtml(jobs: Job[]): { subject: string; html: string } {
  const count = jobs.length;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const subject =
    count === 1
      ? `✨ Power Platform Job Radar • 1 New Role Found Today`
      : `✨ Power Platform Job Radar • ${count} New Roles Found Today`;

  let contentHtml = '';

  if (count === 0) {
    contentHtml = `
      <div style="background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px 24px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 40px; margin-bottom: 12px;">🎯</div>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1e293b; font-weight: 600;">Radar active &amp; scanning</h3>
        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
          No new Power Platform roles matching your criteria were found since the last scan.<br>
          We will keep scanning every morning and alert you as soon as fresh opportunities appear!
        </p>
      </div>
    `;
  } else {
    contentHtml = jobs
      .map((job) => {
        const title = escapeHtml(job.title);
        const company = escapeHtml(job.company || 'Confidential Company');
        const location = escapeHtml(job.location || 'India / Remote');
        const source = escapeHtml(job.source ? job.source.toUpperCase() : 'JOB FEED');
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
                    <span style="font-size: 11px; font-weight: 700; color: #742774; text-transform: uppercase; letter-spacing: 0.5px;">${source}</span>
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
                    <a href="${escapeHtml(job.url)}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #742774 0%, #4a154b 100%); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(116, 39, 116, 0.25);">
                      Apply Now &nearr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
      })
      .join('');
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
            <td style="background: linear-gradient(135deg, #742774 0%, #2e0854 100%); border-radius: 14px 14px 0 0; padding: 32px 28px; text-align: left; color: #ffffff;">
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                ⚡ Daily Morning Dispatch
              </div>
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Power Platform Job Radar
              </h1>
              <p style="margin: 0; font-size: 14px; color: #e9d5ff; font-weight: 500;">
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
            <td style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;">
                Automated by <strong>Power Platform Job Radar</strong> running 24/7 on GitHub Actions.
              </p>
              <p style="margin: 0;">
                100% Free &bull; Zero Server Costs &bull; Tracked via SQLite
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
