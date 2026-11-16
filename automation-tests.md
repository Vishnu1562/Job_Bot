# Automation Behavioral Specification & Tests Contract
## Power Platform Job Radar (Node.js / TypeScript Edition)

### Feature / Change Summary
Automated "Power Platform Job Radar" script in Node.js / TypeScript that runs every morning at 8:30 AM IST (03:00 UTC) via GitHub Actions, scrapes free public endpoints (Remotive, Jobicy, Arbeitnow, public RSS feeds), filters for Power Platform roles in India (remote/hybrid/on-site), smart-tags skills, deduplicates via SQLite (`jobs.db`), and sends a responsive HTML email digest using Gmail SMTP.

---

### Preconditions
- Node.js runtime (v22+ / v24+).
- SQLite storage enabled (native `node:sqlite`).
- Valid environment variables configured for email dispatch: `SENDER_EMAIL`, `SENDER_PASSWORD`, `RECIPIENT_EMAIL`.
- Network access to free job feed endpoints (Remotive, Jobicy, Arbeitnow, RSS feeds).

---

### Test Data
- **Sample Power Platform Job (India Remote)**:
  - Title: "Senior Power Platform Developer"
  - Company: "Contoso Tech"
  - Location: "India / Remote"
  - Description: "Looking for an expert in Canvas Apps, Dataverse, Power Automate, and PCF components."
  - URL: "https://example.com/jobs/contoso-101"
- **Sample Non-India Job (US Remote Only)**:
  - Title: "Power Platform Consultant"
  - Company: "Fabrikam US"
  - Location: "Remote - USA Only"
  - Description: "Dynamics 365 and Power Apps specialist in US time zones."
  - URL: "https://example.com/jobs/fabrikam-202"
- **Sample Negative Filter Job (Data Entry / Unpaid)**:
  - Title: "Unpaid Intern - Excel Data Entry"
  - Company: "SpamCorp"
  - Location: "India"
  - Description: "Basic Excel and data entry internship. Unpaid."
  - URL: "https://example.com/jobs/spam-303"

---

### Happy Flows

#### [HF-001] Job Ingestion & India Location Filtering
- **Preconditions**: Public API responses containing raw job listings.
- **Action**: Feed processor filters listings matching target keywords ("Power Apps", "Power Platform", "Power Automate", "Dataverse", "PCF", "Power Pages", "Dynamics 365") and location ("India", "Bangalore", "Hyderabad", "Remote - India", "Worldwide Remote").
- **Expected Result**: Only relevant Power Platform jobs matching India or Worldwide Remote are retained; US/EU-only or unrelated roles are excluded.
- **Final State**: Normalized list of `Job` objects ready for deduplication and tagging.

#### [HF-002] Smart Skill Tagging
- **Preconditions**: Normalized job listings with title and description text.
- **Action**: Skill tagger scans text for predefined keywords.
- **Expected Result**: Matching skill badges added:
  - `[Canvas Apps]`
  - `[Model-Driven]`
  - `[Dataverse]`
  - `[PCF]`
  - `[Power Automate]`
  - `[Copilot Studio]`
  - `[Power Pages]`
  - `[Dynamics 365]`
- **Final State**: Each job has a `tags` array containing identified skills (minimum default `[Power Platform]`).

#### [HF-003] SQLite Deduplication Engine
- **Preconditions**: SQLite database `jobs.db` initialized with schema.
- **Action**: Scraped jobs are checked against `jobs.db`. New jobs are inserted; existing URLs/IDs are identified as duplicates.
- **Expected Result**: Deduplication returns only genuine new jobs for the daily email. Duplicate entries are not inserted or re-sent.
- **Final State**: `jobs.db` holds persistent record of sent jobs; returns new unemailed jobs.

#### [HF-004] Responsive HTML Email Generation (Jobs Found)
- **Preconditions**: 1 or more new jobs identified.
- **Action**: HTML template engine generates email with summary header: "✨ Power Platform Job Radar • [X] New Roles Found Today".
- **Expected Result**: Beautiful, responsive HTML containing:
  - Daily header with job count and scan date.
  - Cards per job: Company name, Job title, Location badge, Skill tag pills, and an `[Apply Now ↗]` CTA button.
  - Inline CSS for compatibility across Outlook, Gmail, Apple Mail, and mobile clients.
- **Final State**: Rendered HTML string ready for SMTP transport.

#### [HF-005] Status Digest Generation (0 New Jobs Found)
- **Preconditions**: 0 new jobs found after scraping and deduplication.
- **Action**: Digest generator creates "0 New Roles Found Today" status email.
- **Expected Result**: Email clearly states:
  - "✨ Power Platform Job Radar • 0 New Roles Found Today"
  - Confirmation message: "Radar active & scanning. No new roles matching your criteria since the last scan."
- **Final State**: Status email ready for dispatch so user knows automation is healthy.

#### [HF-006] SMTP Email Dispatcher
- **Preconditions**: Valid SMTP credentials (`SENDER_EMAIL`, `SENDER_PASSWORD`, `RECIPIENT_EMAIL`).
- **Action**: Mailer connects to `smtp.gmail.com:587` with TLS and sends email.
- **Expected Result**: Message successfully handed off to Gmail SMTP server with correct `From`, `To`, `Subject`, and HTML body.
- **Final State**: Email sent timestamp recorded.

---

### Negative Flows

#### [NF-001] Negative Filter Exclusion
- **Preconditions**: Listings containing negative keywords ("unpaid", "internship", "data entry", "excel only", "recruiter spam").
- **Action**: Negative filter inspects title and description.
- **Expected Result**: Jobs containing negative filters are dropped even if they mention "Power" or "Excel".
- **Final State**: Zero spam/unpaid jobs in the ingestion pipeline.

#### [NF-002] Graceful Upstream Failure
- **Preconditions**: One API endpoint (e.g., Remotive or Jobicy) is down, returns 500, or times out.
- **Action**: Scraper queries all endpoints concurrently with `Promise.allSettled`.
- **Expected Result**: Failed endpoint logs warning; successful endpoints continue processing without pipeline termination.
- **Final State**: Pipeline completes with available data from working feeds.

#### [NF-003] Missing Environment Credentials Validation
- **Preconditions**: Missing `SENDER_EMAIL`, `SENDER_PASSWORD`, or `RECIPIENT_EMAIL`.
- **Action**: Mailer verifies environment before attempting connection.
- **Expected Result**: Fails fast with clear diagnostic message stating which variable is missing, avoiding opaque network timeouts.
- **Final State**: Execution halts cleanly with code 1.

---

### Edge Cases

#### [EC-001] India Location Variations & Dialects
- **Preconditions**: Job locations formatted as "Bengaluru, Karnataka", "Hyderabad, Telangana", "Remote, IN", "IN", "India (Hybrid)", "Worldwide Remote", "Anywhere".
- **Action**: Location matcher evaluates geographic tokens.
- **Expected Result**: Correctly accepts Indian metropolitan tech hubs and global remote listings; rejects regional exclusions (e.g., "US Remote Only", "UK Only").
- **Final State**: Accurate geographic filtering.

#### [EC-002] Special Characters in Job Titles & Descriptions
- **Preconditions**: Job titles containing HTML entities or characters (`&`, `<`, `>`, `"`, `'`, `/`).
- **Action**: Template generator sanitizes job title and company fields before injecting into HTML.
- **Expected Result**: Clean rendering without broken HTML layout or XSS risks.
- **Final State**: Properly escaped HTML document.

#### [EC-003] Cross-Feed Duplicate Detection
- **Preconditions**: Same job posted across multiple boards with slightly different URL tracking parameters (e.g. `?ref=jobicy` vs `?utm_source=remotive`).
- **Action**: Deduplicator normalizes URLs (strips query parameters) and matches on `(normalized_title, normalized_company)`.
- **Expected Result**: Only 1 instance of the job is kept.
- **Final State**: No redundant listings in the email digest.

---

### Validation Rules
- `VR-001`: Every job must have non-empty `title`, `company`, and valid `url` (starting with `http://` or `https://`).
- `VR-002`: Skill tags must contain at least one valid tag (defaults to `[Power Platform]` if no sub-skill detected).
- `VR-003`: Email address format validation for sender and recipient.

---

### Loading / State Transitions
- `ST-001`: SQLite database initialization creates table `jobs` (`id`, `title`, `company`, `url`, `location`, `tags`, `scraped_at`, `emailed_at`) with UNIQUE constraint on `url`.
- `ST-002`: Pipeline progression: `IDLE` -> `FETCHING_FEEDS` -> `FILTERING_AND_TAGGING` -> `DEDUPLICATING` -> `GENERATING_EMAIL` -> `DISPATCHING_SMTP` -> `PERSISTING_DB` -> `COMPLETE`.

---

### Recovery / Retry
- `RR-001`: Transient HTTP fetch errors retry up to 2 times with a 1-second delay before falling back.
- `RR-002`: Persistent deduplication integrity: If mail dispatch fails, new jobs remain marked as unemailed so they are not permanently lost.

---

### Authentication / Authorization
- `AUTH-001`: SMTP authentication supporting free Resend SMTP (`smtp.resend.com:465` with automatic `fromEmail: onboarding@resend.dev`), Brevo SMTP relay (`smtp-relay.brevo.com:587`), Gmail SMTP (`smtp.gmail.com:587`), or custom SMTP providers over TLS. Configurable via `SMTP_HOST`, `SMTP_PORT`, and optional `FROM_EMAIL`.

---

### Regression Requirements
- `REG-001`: Consecutive pipeline execution with identical feed data must yield 0 new jobs on the second run and send the 0-job status digest.
