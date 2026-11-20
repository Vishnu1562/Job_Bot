# Automation Behavioral Specification & Tests Contract
## Multi-Profile Job Radar (Power Platform, Full Stack & Java Backend Editions)

### Feature / Change Summary
Modular, generic, scalable Job Radar in Node.js / TypeScript that runs every morning via GitHub Actions, supports multiple search profiles with independent skill tagging and recipient mappings:
1. **Power Platform Profile (Celine - 6.1 Yrs)**: Power Apps (Canvas Apps), Power Automate, Dataverse, SharePoint Online, M365 Integration, Copilot Studio, PL-400. Experience bounds: 3–8 years.
2. **Full Stack Profile**: Full Stack / Backend / Frontend Developer with NestJS, Angular, .NET, PostgreSQL, MSSQL, Azure DevOps, GitHub. Experience bounds: 2–8 years.
3. **Java & Spring Boot Profile (Aswin M Suthan - 4 Yrs)**: Enterprise Java Software Engineer with Spring Boot, JPA/Hibernate, Microservices, REST APIs, Oracle SQL, PostgreSQL, Docker, Spring Security/JWT, Python/Shell. Experience bounds: 2–6 years.
Easily expandable with additional job profiles by adding definitions to `src/config/profiles.ts`.
Each profile deduplicates via SQLite (`jobs.db`) with `profile_id` scoping, generates tailored responsive HTML email digests, and dispatches to each profile's configured recipient (or defaults to `RECIPIENT_EMAIL`).

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
- **Sample Full Stack Developer Job (India Remote)**:
  - Title: "Full Stack Engineer (Angular / NestJS)"
  - Company: "Nexus Innovations"
  - Location: "Bangalore, India"
  - Description: "Building scalable microservices with NestJS, Angular frontend, PostgreSQL database, and CI/CD via Azure DevOps and GitHub."
  - URL: "https://example.com/jobs/nexus-202"
- **Sample Java Backend Job (India Remote)**:
  - Title: "Senior Java Backend Engineer"
  - Company: "FinTech Banking Solutions"
  - Location: "Kochi / Remote - India"
  - Description: "Experience in Java, Spring Boot, Hibernate, REST APIs, Microservices, Oracle SQL, PostgreSQL, and Docker."
  - URL: "https://example.com/jobs/fintech-606"
- **Sample Full Stack .NET Job**:
  - Title: "Senior .NET & Angular Developer"
  - Company: "Global Financial Systems"
  - Location: "Hyderabad, India"
  - Description: "Expertise in .NET Core, C#, MSSQL Server, Angular 17+, and Azure DevOps pipelines."
  - URL: "https://example.com/jobs/global-303"
- **Sample Non-India Job (US Remote Only)**:
  - Title: "Power Platform Consultant"
  - Company: "Fabrikam US"
  - Location: "Remote - USA Only"
  - Description: "Dynamics 365 and Power Apps specialist in US time zones."
  - URL: "https://example.com/jobs/fabrikam-404"
- **Sample Negative Filter Job (Data Entry / Unpaid)**:
  - Title: "Unpaid Intern - Excel Data Entry"
  - Company: "SpamCorp"
  - Location: "India"
  - Description: "Basic Excel and data entry internship. Unpaid."
  - URL: "https://example.com/jobs/spam-505"

---

### Happy Flows

#### [HF-001] Job Ingestion & India Location Filtering
- **Preconditions**: Public API responses containing raw job listings.
- **Action**: Feed processor filters listings matching target keywords and location ("India", "Bangalore", "Hyderabad", "Remote - India", "Worldwide Remote").
- **Expected Result**: Only relevant jobs matching India or Worldwide Remote are retained; US/EU-only or unrelated roles are excluded.
- **Final State**: Normalized list of `Job` objects ready for deduplication and tagging.

#### [HF-002] Power Platform Smart Skill Tagging
- **Preconditions**: Normalized Power Platform job listings with title and description text.
- **Action**: Skill tagger scans text for predefined keywords.
- **Expected Result**: Matching skill badges added:
  - `[Canvas Apps]`, `[Model-Driven]`, `[Dataverse]`, `[PCF]`, `[Power Automate]`, `[Copilot Studio]`, `[Power Pages]`, `[Dynamics 365]`.
- **Final State**: Each job has a `tags` array containing identified skills (fallback `[Power Platform]`).

#### [HF-003] SQLite Deduplication Engine
- **Preconditions**: SQLite database `jobs.db` initialized with schema.
- **Action**: Scraped jobs are checked against `jobs.db`. New jobs are inserted; existing URLs/IDs are identified as duplicates.
- **Expected Result**: Deduplication returns only genuine new jobs for the daily email. Duplicate entries are not re-sent.
- **Final State**: `jobs.db` holds persistent record of sent jobs; returns new unemailed jobs.

#### [HF-004] Responsive HTML Email Generation (Jobs Found)
- **Preconditions**: 1 or more new jobs identified for a profile.
- **Action**: HTML template engine generates email with summary header: "✨ [Profile Name] • [X] New Roles Found Today" and personalized motivational greeting.
- **Expected Result**: Beautiful, responsive HTML containing:
  - Daily header with profile name, job count, and scan date.
  - Personal motivational greeting addressing candidate (e.g. "Hey Aswin! Take a deep breath — the job hunt is a journey, but you're doing great and you will find the right role. Here are today's top curated opportunities for you:").
  - Cards per job: Company name, Job title, Location badge, Skill tag pills, and an `Apply Now ↗` CTA button with clean Unicode arrow (no broken HTML entity text like `&nearr;`).
  - Professional, warm footer sign-off ("Curated with care • Stay confident and keep going! ✨") without robotic infrastructure text ("running 24/7 on GitHub Actions", "Tracked via SQLite").
  - Multipart alternative text generation (`text` + `html`) for high inbox deliverability.
  - Inline CSS for compatibility across Outlook, Gmail, Apple Mail, and mobile clients.
- **Final State**: Rendered HTML and plain-text strings ready for SMTP transport.

#### [HF-005] Status Digest Generation (0 New Jobs Found)
- **Preconditions**: 0 new jobs found after scraping and deduplication for a profile.
- **Action**: Digest generator creates warm, motivating "0 New Roles Found Today" status email.
- **Expected Result**: Email clearly states:
  - "✨ [Profile Name] • 0 New Roles Found Today"
  - Empathetic and encouraging message addressing the candidate (e.g. "Hey Aswin, it's completely fine! No worries at all if today was a bit quiet on new postings — good opportunities take time, but your skills and hard work speak for themselves. You will find the right fit!").
  - Professional warm footer sign-off without technical developer jargon.
- **Final State**: Status email ready for dispatch so candidate stays motivated and knows automation is healthy.

#### [HF-006] SMTP Email Dispatcher
- **Preconditions**: Valid SMTP credentials (`SENDER_EMAIL`, `SENDER_PASSWORD`, `RECIPIENT_EMAIL`).
- **Action**: Mailer connects to SMTP provider (Resend, Brevo, Gmail) and sends email.
- **Expected Result**: Message successfully handed off to SMTP server with correct `From`, `To`, `Subject`, and HTML body.
- **Final State**: Email sent timestamp recorded.

#### [HF-007] Multi-Profile Configuration Engine
- **Preconditions**: `src/config/profiles.ts` defining distinct profiles (`power-platform`, `full-stack`).
- **Action**: Configuration loader retrieves active profiles and resolves recipient emails (falling back to `RECIPIENT_EMAIL` if profile recipient is not individually overridden).
- **Expected Result**: Returns array of valid `JobProfile` objects.
- **Final State**: Pipeline has access to all configured search profiles.

#### [HF-008] Full Stack Job Matching
- **Preconditions**: Raw job listings from free feeds.
- **Action**: Profile matcher tests listing against Full Stack keywords and target tech stack (`NestJS`, `Angular`, `.NET`, `Postgres`, `MSSQL`, `Azure DevOps`, `GitHub`).
- **Expected Result**: Matches developer roles with target skills; rejects unrelated non-matching positions.
- **Final State**: Candidates filtered for Full Stack profile.

#### [HF-009] Full Stack Smart Skill Tagging
- **Preconditions**: Matching Full Stack job listing.
- **Action**: Skill tagger detects skills from title and description.
- **Expected Result**: Identifies and attaches tags:
  - `[NestJS]`, `[Angular]`, `[.NET]`, `[PostgreSQL]`, `[MSSQL]`, `[Azure DevOps]`, `[GitHub]`.
- **Final State**: Job object contains all detected technology tags (fallback `[Full Stack]`).

#### [HF-010] Profile-Scoped Deduplication
- **Preconditions**: SQLite database tracking jobs per `(profile_id, url)`.
- **Action**: Scraped job is checked against the database specifically for the running profile.
- **Expected Result**: A job sent to Profile A does not prevent Profile B from receiving it if it qualifies, while preventing Profile A from receiving it twice.
- **Final State**: Independent deduplication across distinct recipients and profiles.

#### [HF-011] Multi-Profile Pipeline Orchestration
- **Preconditions**: Multiple profiles configured.
- **Action**: Main orchestrator loops over each profile, runs scraping/filtering, deduplicates, and sends separate branded email digests to each recipient.
- **Expected Result**: Both Power Platform and Full Stack email digests are generated and dispatched to their respective recipients.
- **Final State**: All active profiles processed.

#### [HF-012] Java & Spring Boot Profile Configuration
- **Preconditions**: Resume-based Java profile defined (`id: 'java-backend'`).
- **Action**: Loader instantiates Java profile, resolving recipient via `RECIPIENT_EMAIL_JAVA` (or default `RECIPIENT_EMAIL`).
- **Expected Result**: Profile has name "Java & Spring Boot Developer Job Radar" and query terms for Java and Spring Boot.
- **Final State**: Java profile ready for ingestion.

#### [HF-013] Java & Spring Boot Skill Tagging
- **Preconditions**: Job listing matching Java profile.
- **Action**: Skill tagger scans for Java ecosystem technologies.
- **Expected Result**: Correctly tags `[Spring Boot]`, `[Java]`, `[Hibernate/JPA]`, `[Microservices]`, `[REST APIs]`, `[PostgreSQL]`, `[Oracle SQL]`, `[Docker]`, `[Spring Security]`, `[React]`.
- **Final State**: Job object has relevant Java tags.

#### [HF-014] Experience Level Range Matching
- **Preconditions**: Profile configured with `minYears` and `maxYears` (e.g. 2–6 years for Java, 2–8 years for Full Stack / Power Platform).
- **Action**: Experience parser checks job title and description text for years of experience requirements.
- **Expected Result**: Jobs requiring matching years (e.g. "3-5 years", "4+ years") are accepted.
- **Final State**: Candidate listing matches experience requirements.

#### [HF-015] Unspecified Experience Handling
- **Preconditions**: Job description contains no explicit years of experience statement.
- **Action**: Experience matcher checks job title for excluded seniorities (e.g. Director, VP, Intern).
- **Expected Result**: Accepted if title contains standard developer roles without excluded seniority titles.
- **Final State**: Legitimate tech jobs with unstated experience are not dropped.

#### [HF-016] Resume-Tailored Power Platform Experience & Skills (Celine)
- **Preconditions**: Power Platform profile configured with 3–8 years experience range.
- **Action**: Ingestion checks for matching years (e.g. "4-6 years", "5+ years") and tags resume-specific skills: `[Canvas Apps]`, `[Power Automate]`, `[Dataverse]`, `[SharePoint Online]`, `[M365 / PL-400]`, `[Copilot Studio]`.
- **Expected Result**: Jobs matching Celine's 6.1 years experience and skills are tagged and accepted.
- **Final State**: Tailored Power Platform listings ready for dispatch.

#### [HF-017] Resume-Tailored Java Backend Experience & Skills (Aswin M Suthan)
- **Preconditions**: Java profile configured with 2–6 years experience range.
- **Action**: Ingestion checks for matching years (e.g. "3-5 years", "4+ years") and tags resume-specific skills: `[Java]`, `[Spring Boot]`, `[Hibernate/JPA]`, `[Oracle SQL]`, `[PostgreSQL]`, `[Docker]`, `[Spring Security / JWT]`, `[Python / Shell]`.
- **Expected Result**: Jobs matching Aswin's 4 years experience and enterprise banking skills are tagged and accepted.
- **Final State**: Tailored Java backend listings ready for dispatch.

#### [HF-018] Personalized & Motivating Email Digest Template
- **Preconditions**: Candidate name configured per profile (`candidateName: 'Aswin'`, `candidateName: 'Celine'`, etc.).
- **Action**: Template generator builds email with personalized motivational greeting, encouraging zero-job state, and professional warm footer.
- **Expected Result**:
  - Personal greeting at top: "Hey [Name]! Take a deep breath — the job hunt is a journey, but you're doing great and you will find the right role."
  - When 0 jobs: "Hey [Name], it's completely fine! No worries at all if today was a bit quiet on new postings — good opportunities take time... You will find the right fit!"
  - Replaces all technical server/bot strings (`running 24/7 on GitHub Actions`, `Tracked via SQLite`) with warm closing ("Curated with care • Stay confident and keep going! ✨").
- **Final State**: Candidate receives an encouraging, personalized email tailored specifically for them.

#### [HF-019] Target Company Prioritization & Badging (Global + Infopark Kochi)
- **Preconditions**: Profile configured with `targetCompanies` including Global Tech Majors (Microsoft, Google, Amazon, Oracle, Cisco, Adobe, Salesforce), IT giants (Accenture, Infosys, Cognizant, Capgemini, Deloitte, IBM, PwC, HCLTech, LTIMindtree), and Kochi Infopark majors (UST, IBS Software, QBurst, Tata Elxsi, Experion, Fingent, NeST Digital, KeyValue).
- **Action**: Template generator detects matching companies, badges them with `⭐ Priority Target`, and sorts them to the top of the email digest.
- **Expected Result**: Priority company jobs appear first in the email digest, followed by all other valid matching openings. Broad search is preserved.
- **Final State**: Top-tier and local tech employer roles highlighted prominently for the candidate.

#### [HF-020] Multi-Source Ingestion with RemoteOK and Expanded Tech RSS Feeds
- **Preconditions**: Available free public feeds: Remotive API, Jobicy API, Arbeitnow API, RemoteOK API, WeWorkRemotely RSS feeds (programming, back-end, full-stack, front-end), Himalayas RSS, and NoDesk RSS.
- **Action**: Feed scraper queries all free public endpoints concurrently with `Promise.allSettled`, maps their respective schemas (e.g. RemoteOK `position`, `apply_url`), and passes listings through profile filters and deduplication.
- **Expected Result**: Successfully parses valid developer listings across all feeds without API keys or credentials.
- **Final State**: Broadened job pool across multiple independent tech sources.

#### [HF-021] Smart Digest Capping (Top 15 Roles & Queue Roll-over)
- **Preconditions**: Profile matches more than 15 jobs in a single scan (e.g., 52 Full Stack jobs) or has backlog unemailed roles from earlier scans.
- **Action**:
  - Unemailed backlog from SQLite (`db.getUnemailedJobs(profile.id)`) is merged with newly ingested postings.
  - Template generator sorts jobs by Tier 1 &rarr; Tier 2 &rarr; Tier 3, then slices the list to the Top 15 roles (`maxJobs = 15`).
  - Renders a clean overflow summary badge below the job cards: `+ X additional roles identified today • Showing top 15 priority matches`.
  - Appends overflow summary note in plain-text alternative.
  - Dispatcher marks **ONLY the Top 15 displayed jobs** as `emailed_at = datetime('now')` in SQLite database.
  - Unsent overflow roles remain in SQLite (`emailed_at IS NULL`) and naturally roll over into subsequent morning dispatches or can be browsed immediately on the web portal.
  - Mailer includes standard automated headers (`Auto-Submitted: auto-generated`, `X-Auto-Response-Suppress: OOF, AutoReply`).
  - Main dispatcher introduces a 2-second throttling pause between profile email dispatches to prevent SMTP burst flags.
- **Expected Result**:
  - Exactly 15 job cards rendered in HTML and listed in text when count > 15.
  - Email payload remains compact (< 35 KB) and outbound links capped at 15, preventing Gmail 102 KB message clipping and link-spam heuristic penalties.
  - Zero jobs lost: un-displayed overflow jobs remain in queue and are instantly accessible on the web portal.
  - All jobs <= 15 are rendered completely without overflow badge.
- **Final State**: Highly deliverable, reader-friendly daily morning digest with full web portal companion for exploring all listings.

#### [HF-022] Indian IT Hubs Aggregator via JSearch & Adzuna (LinkedIn, Naukri, Indeed)
- **Preconditions**: Active profile targeting Indian developer jobs. Configurable `RAPIDAPI_KEY` (for JSearch Google for Jobs aggregator indexing LinkedIn, Naukri, Indeed, Glassdoor) and `ADZUNA_APP_ID`/`ADZUNA_APP_KEY` (for Adzuna India).
- **Action**:
  - Scraper queries JSearch API and Adzuna India with profile-specific search terms tailored to Indian IT parks and hubs across India (Kochi Infopark, Trivandrum Technopark, Bangalore, Hyderabad, Pune, Chennai, Delhi NCR, Mumbai, etc.).
  - Normalizes real publisher sources (`source: 'linkedin'`, `'naukri'`, `'indeed'`, `'adzuna'`).
  - Extracts clean direct apply links, company names, and domestic locations.
  - In absence of keys, gracefully degrades without interrupting existing free RSS/API pipelines.
- **Expected Result**: Successfully ingests authentic native Indian job postings from LinkedIn, Naukri, and Indeed.
- **Final State**: Live domestic Indian jobs available in daily digest.

#### [HF-023] JSearch & LinkedIn / Naukri Feed Prioritization
- **Preconditions**: Ingestion pool containing generic remote feeds (WeWorkRemotely, RemoteOK, Remotive), Target Company jobs, and JSearch feeds (LinkedIn, Naukri, Indeed, Glassdoor).
- **Action**: Email digest generator prioritizes jobs in strictly ordered tiers before taking the Top 15 cap:
  1. **Tier 1 (Top Priority)**: Live JSearch postings (`LinkedIn`, `Naukri`, `Indeed`, `Glassdoor`, or ID prefixed with `jsearch-`). If also a target company, ranked at the very top.
  2. **Tier 2**: Priority Target Companies from other feeds (`isTargetCompany: true`, e.g. Microsoft, Google, UST, IBS, QBurst on generic feeds).
  3. **Tier 3**: Generic international remote boards (WeWorkRemotely, RemoteOK, Remotive, Jobicy).
- **Expected Result**: All LinkedIn, Naukri, and Indeed roles appear first at the top of the email digest, followed by target company openings, followed by generic remote postings.
- **Final State**: Candidates see actionable domestic LinkedIn/Naukri jobs first, followed by target companies, preventing generic remote feeds from taking the top slots.

#### [HF-024] JSearch v5 (search-v2) Clean API Contract & Envelope Extraction
- **Preconditions**: Active profile targeting Indian developer roles with `RAPIDAPI_KEY` configured in environment.
- **Action**:
  - Scraper queries RapidAPI JSearch v5 endpoint directly: `https://jsearch.p.rapidapi.com/search-v2`.
  - Appends query parameters: `query=${searchQuery}&num_pages=1&country=in&date_posted=all`.
  - Passes authentication headers: `x-rapidapi-key: <key>` and `x-rapidapi-host: jsearch.p.rapidapi.com`.
  - Type-safely extracts job listings from `data.data.jobs` response envelope.
  - Normalizes job fields (`job_title` / `title`, `employer_name` / `company_name`, `job_apply_link` / `url`, `job_city` / `job_country`).
- **Expected Result**: Clean, direct ingestion of live LinkedIn, Naukri, and corporate listings with zero probing overhead or 404 retries.
- **Final State**: Clean, robust, production-grade JSearch v5 integration.

#### [HF-025] Dual Recipient Dispatch (Default + Profile Email)
- **Preconditions**: `RECIPIENT_EMAIL` is set in environment (e.g. `default@example.com`), and a profile-specific recipient is also set (e.g. `RECIPIENT_EMAIL_POWERPLATFORM=celine@example.com` or `RECIPIENT_EMAIL_JAVA=aswin@example.com`).
- **Action**: Profile recipient resolver combines both default and profile-specific email into comma-delimited list for nodemailer's `to` field (`"default@example.com, celine@example.com"`).
- **Expected Result**: Single email digest is sent addressed to BOTH default and candidate email addresses. Both parties receive the digest.
- **Final State**: Default email receives digests for all profiles, while candidates also receive their respective profile's digest.

#### [HF-026] Graceful Fallback When Profile Recipient Is Missing
- **Preconditions**: `RECIPIENT_EMAIL` is set in environment, but a profile-specific recipient (e.g. `RECIPIENT_EMAIL_FULLSTACK`) is not provided, is undefined, or is empty whitespace.
- **Action**: Profile recipient resolver safely falls back to only `RECIPIENT_EMAIL`.
- **Expected Result**: Pipeline delivers digest to default recipient without failing, throwing errors, or inserting invalid recipient syntax.
- **Final State**: Resilient delivery ensuring notifications never fail due to missing profile-specific email variables.

#### [HF-027] Dedicated Email Sections (Domestic vs Global Remote)
- **Preconditions**: Queue containing both regional/domestic listings (JSearch LinkedIn, Naukri, Indeed, Adzuna) and global remote listings (RemoteOK, Remotive, Jobicy, Arbeitnow).
- **Action**: Email digest partitions candidate jobs into two distinct visual sections:
  1. `📍 Domestic & Regional (LinkedIn, Naukri & Corporate Boards)` (up to 10–12 slots).
  2. `🌐 Curated Global & Remote Opportunities` (capped at 3–5 slots).
- **Expected Result**: High visual clarity separating verified domestic Indian openings from international remote contracts. The word "Priority" is deprecated from the domestic header. If either section has 0 jobs, its header is omitted cleanly.
- **Final State**: Candidate sees domestic jobs immediately without dilution from global remote feeds.

#### [HF-028] 48-Hour Backlog Expiry & Queue Maintenance
- **Preconditions**: Jobs in SQLite database where `emailed_at IS NULL` and `scraped_at < datetime('now', '-48 hours')`.
- **Action**: Database maintenance function `expireOldUnemailedJobs(48, profileId)` marks stale unemailed jobs as expired (`emailed_at = 'EXPIRED'`).
- **Expected Result**: Prevents stale jobs from piling up indefinitely and prevents artificial inflation of queue counts.
- **Final State**: Only active, fresh listings (≤ 48 hours) remain in the dispatch queue.

#### [HF-029] Single Unified Standalone HTML Template (`emailDigest.html`)
- **Preconditions**: Email digest generator called to produce HTML output.
- **Action**: Template engine loads a single unified `.html` file from `src/email/templates/emailDigest.html`:
  - Contains the complete responsive email shell (header gradient, container, footer).
  - Contains cleanly defined snippet blocks for dynamic sections:
    - `<!-- JOB_CARD_START -->...<!-- JOB_CARD_END -->`
    - `<!-- SECTION_HEADER_START -->...<!-- SECTION_HEADER_END -->`
    - `<!-- GREETING_CARD_START -->...<!-- GREETING_CARD_END -->`
    - `<!-- EMPTY_STATE_START -->...<!-- EMPTY_STATE_END -->`
    - `<!-- OVERFLOW_CARD_START -->...<!-- OVERFLOW_CARD_END -->`
  - Injects values into `{{token}}` placeholders safely with HTML escaping.
  - Can be opened directly in any browser for immediate visual design preview.
- **Expected Result**: 1 single template file instead of 6 fragmented files. Zero clutter in the file tree, zero raw HTML in `.ts` files, and instant browser previewability.
- **Final State**: Clean, cohesive, unified HTML template architecture.

#### [HF-030] Per-Profile Custom Template Override Resolution
- **Preconditions**: Profile configured with custom layout needs or optional dedicated template file.
- **Action**: Template loader checks for profile-specific template overrides (e.g. `templates/profiles/${profileId}.html`), falling back cleanly to generic `emailDigest.html`.
- **Expected Result**: Single generic template serves all profiles by default without code duplication, while allowing profile-specific customization when desired.
- **Final State**: Flexible, DRY templating architecture.

#### [HF-033] Unconditional 60-Day Rolling Window Retention & Storage Compaction
- **Preconditions**: Database contains any job records older than 60 days.
- **Action**: Database maintenance function `pruneHistoricalJobs(60)`:
  1. Unconditionally deletes ANY job older than 60 days (`WHERE scraped_at < datetime('now', '-60 days')`), regardless of whether it is sent, expired, or unemailed.
  2. Clears heavy `description` fields on all already-emailed jobs to slash storage weight by ~95% while keeping primary key `(profile_id, url)` for deduplication within the 60-day window.
  3. Executes `VACUUM` to reclaim disk space.
- **Expected Result**: Database self-maintains and stays between 1 MB and 3 MB permanently with zero records older than 60 days surviving.
- **Final State**: Infinite scalability on GitHub serverless without unbounded repo growth.

#### [HF-034] Guaranteed Zero Duplicate Delivery within Retention Period
- **Preconditions**: Scraper ingests listings that were already emailed or seen in the last 60 days.
- **Action**: Deduplication engine queries primary key `(profile_id, url)`.
- **Expected Result**: Previously seen jobs are rejected as known duplicates (`isJobKnown === true`), preventing identical roles from ever being re-emailed within 60 days.
- **Final State**: High signal-to-noise ratio: only genuinely fresh roles sent daily.

#### [HF-035] Web Portal Data Exporter (Chronological & Tiered 60-Day Archive)
- **Preconditions**: SQLite database contains jobs across multiple profiles, dates (0 to 60 days), and sources.
- **Action**: Module `src/portal/portalDataExporter.ts` queries all active jobs within retention window:
  1. Sorts chronologically with Today's newest jobs at the top (`scraped_at DESC`), followed by Yesterday and historical dates.
  2. Divides listings into dedicated tier sections matching the email hierarchy:
     - 📍 **Domestic & Regional (LinkedIn, Naukri & Corporate Boards)**
     - 🌐 **Curated Global & Remote Opportunities**
  3. Tags priority target companies with `⭐ Priority Target`.
  4. Omits private candidate names (`candidateName`) from public portal payloads to ensure candidate privacy on public web deployment.
- **Expected Result**: Returns structured JSON data partitioned by profile, date, and tier for client-side rendering with zero private candidate names exposed.
- **Final State**: Clean, normalized data layer ready for static site generation.

#### [HF-036] Static Web Portal Generator (Single-Page App on GitHub Pages)
- **Preconditions**: Portal data payload and target output directory (`docs/`).
- **Action**: Module `src/portal/portalPageBuilder.ts` generates self-contained `docs/index.html` and `docs/jobs.json`:
  1. Responsive dashboard with Profile Switcher tabs (`All`, `Power Platform`, `Full Stack Developer`, `Java Backend`).
  2. Date timeline filters (`Today's Batch`, `Yesterday`, `Past 7 Days`, `Full 60-Day Archive`).
  3. Real-time instant search bar (matches title, company, skills, location).
  4. Interactive candidate tracker: **⭐ Save** and **✅ Applied** toggle buttons persisted in browser `localStorage`.
  5. Dedicated tabs to review `Saved Roles` and `Applied Roles`.
- **Expected Result**: Zero-build-overhead, self-contained single-page application ready to be served by GitHub Pages.
- **Final State**: Seamless web portal deployed automatically every morning for $0.

#### [HF-037] Email Digest CTA Integration to Web Portal
- **Preconditions**: Daily email digest generated for candidate.
- **Action**: Email generator embeds `[🌐 View All Roles on Web Portal ↗]` CTA buttons in greeting card and overflow section.
- **Expected Result**: Recipients can click through to browse 100% of today's listings and 60-day backlog on the web board.
- **Final State**: Tight loop connecting push email notifications to interactive web exploration.

#### [HF-038] Linear / Raycast Modern Pro UI Aesthetics & KPI Bar
- **Preconditions**: Web portal loaded in modern desktop or mobile browser.
- **Action**: Portal initializes with Linear/Raycast design language:
  1. Sticky frosted glass navigation bar (`backdrop-filter: blur(16px)`).
  2. Ambient gradient glowing cards with elevation micro-interactions.
  3. Dynamic company monogram avatars with deterministic color coding.
  4. Live KPI stats bar showing `Total Active`, `🔥 Found Today`, `📍 Domestic Priority`, and `⭐ Saved`.
  5. Dual Light & Dark Mode toggle with preference persisted in `localStorage`.
- **Expected Result**: Clean, polished, visually stunning user interface matching top developer products.
- **Final State**: High visual appeal with zero CSS framework bloat.

#### [HF-039] Slide-Over Job Detail Drawer
- **Preconditions**: Job listings rendered on portal page.
- **Action**: User clicks on a job card or table row:
  1. Smooth slide-over drawer animates from right edge without navigating away.
  2. Renders company monogram avatar, title, company, location, tier badge, skills, full description, and direct CTA button.
  3. Closes on Escape key, clicking outside overlay, or clicking close button.
- **Expected Result**: Seamless job inspection without opening and switching between multiple browser tabs.
- **Final State**: Fluid, modern single-page experience.

#### [HF-040] (Superseded by HF-057) Interactive View Mode Switcher
- *Note: Superseded by [HF-057] to deliver a streamlined, clutter-free grid-only card experience.*

#### [HF-041] Interactive Feedback Toast Notifications
- **Preconditions**: User marks a job as **⭐ Save** or **✅ Applied**.
- **Action**: A non-intrusive animated toast pill slides in at the bottom right.
- **Expected Result**: Instant positive confirmation of saved status with auto-dismiss in 2.5 seconds.
- **Final State**: Responsive, tactile user feedback.

#### [HF-042] Dedicated Modular Web Portal Architecture (Clean Code TS/HTML/CSS)
- **Preconditions**: Developer working on portal components or deployment build running.
- **Action**: Portal source files are strictly separated by domain concern:
  1. `src/portal/template.html`: Dedicated pure HTML structure without inlined `<style>` or `<script>` application code.
  2. `src/portal/styles.css`: Dedicated pure stylesheet containing all design system rules, theme variables, and responsive layout.
  3. `src/portal/app.ts`: Dedicated pure TypeScript client module with explicit interfaces, event controllers, and DOM handlers.
  4. `src/portal/portalPageBuilder.ts`: Dedicated TypeScript builder that compiles `app.ts` -> `app.js` (via Node type stripping), injects data into `template.html`, and outputs clean modular files to `docs/` (`index.html`, `styles.css`, `app.js`, `jobs.json`).
- **Expected Result**: Clear separation of concerns, zero monolithic strings in TypeScript, clean readable `docs/index.html` linking to external `styles.css` and `app.js`.
- **Final State**: Highly maintainable, modular frontend architecture.

#### [HF-043] Action Button Event Isolation (No Drawer Opening on Save/Applied)
- **Preconditions**: User browsing job cards in Grid mode or rows in Table mode.
- **Action**: User clicks the "⭐ Save" or "✅ Applied" button on a job card or row:
  1. `event.stopPropagation()` stops event bubbling to the parent card/row.
  2. Card footer and action button boundaries prevent triggering drawer expansion.
  3. Job status toggles, toast confirmation fires, and button visual state updates without full-page re-rendering.
- **Expected Result**: Description drawer DOES NOT open when saving or marking a job as applied. Drawer ONLY opens when clicking on the card body, title, company, or row content.
- **Final State**: Polished, bug-free interaction without unexpected drawer popups.

#### [HF-044] Modern Segmented Profile Tabs & Scalable Unified Filter Strip (Option 2)
- **Preconditions**: Web portal loaded with single or multiple active candidate profiles.
- **Action**: Filter deck renders with clean Option 2 architecture:
  1. **Top Profile Tab Strip**: Horizontal scrollable segmented bar with accent color dots, concise labels (stripping redundant "Job Radar" suffixes), role counts, and smooth scroll overflow for 10+ profiles.
  2. **Unified Command & Filter Toolbar**: Search bar seamlessly integrated with compact quick-filter chips for Status (`⭐ Saved`, `✅ Applied`), Timeline (`All Dates`, `Today's Batch`), and Region (`📍 Domestic`, `🌐 Remote`).
  3. **One-Click Reset**: A quick reset button appears when non-default filters are active.
- **Expected Result**: Reduces vertical height by ~50%, looks visually stunning, and scales gracefully to unlimited future profiles without wrapping.
- **Final State**: Clean, developer-grade command deck matching Linear / Raycast standards.

#### [HF-045] User-Facing Region Terminology Standardization
- **Preconditions**: Web portal loaded on desktop or mobile.
- **Action**: Replace all internal engineering jargon ("Tier") in user-facing UI with candidate-friendly "Region" terminology:
  1. Filter toolbar button displays `All Regions` instead of `All Tiers`.
  2. Table view column header displays `Region` instead of `Tier`.
  3. Empty search state text suggests `"All Dates" / "All Regions"` instead of `"All Tiers"`.
- **Expected Result**: Clean, intuitive geographical classification without confusing engineering jargon.
- **Final State**: Candidate-centric UI clarity.

#### [HF-046] High-Resolution Vector Favicon & Brand Iconography
- **Preconditions**: Web portal opened in desktop or mobile web browser.
- **Action**:
  1. `<head>` contains `<link rel="icon" type="image/svg+xml" href="favicon.svg">`.
  2. Dedicated vector asset `docs/favicon.svg` is generated, featuring a modern radar sweep with concentric signal rings and an active role discovery blip.
  3. Browser tab displays the custom glowing radar emblem, replacing the default browser blank globe icon.
- **Expected Result**: Crisp high-DPI browser tab branding and polished visual identity.
- **Final State**: Complete visual finish across browser chrome and page viewport.

#### [HF-047] Collapsible Date and Region Section Accordions
- **Preconditions**: Portal feed rendered with Date groups (Today's Batch, Yesterday, Archive) and Region sections (Domestic Priority, Global Remote).
- **Action**:
  1. User clicks any `.date-header` -> Toggles collapsed/expanded state of that entire date batch.
  2. User clicks any `.tier-header-bar` -> Toggles collapsed/expanded state of that specific regional section.
  3. Rotating chevron indicator (`▾` expanded / `▸` collapsed) visually confirms section state.
  4. Cursor changes to `pointer` with subtle hover glow indicating interactivity.
- **Expected Result**: Candidates can collapse reviewed sections or older date batches to focus on unread roles.
- **Final State**: Clean accordion organization for high-volume browsing.

#### [HF-048] Direct Regional Grouping Without Redundant Date Divider Headers
- **Preconditions**: Portal feed contains active jobs across Domestic and Global Remote regions.
- **Action**:
  1. Portal feed omits outer date batch divider bars (`.date-header`, `🗓️ Today's Batch`).
  2. Jobs are organized directly under clean top-level Regional sections:
     - `📍 Domestic & Regional Priority (LinkedIn, Naukri & Corporate Boards)` with count badge.
     - `🌐 Curated Global & Remote Opportunities` with count badge.
  3. Each regional section features an interactive accordion collapse toggle with rotating chevron (`▾`/`▸`).
  4. Top filter toolbar retains Timeline chips (`All Dates`, `Today's Batch`, `Yesterday`) for date scoping without DOM nesting.
- **Expected Result**: Single-tier hierarchy reduces visual clutter, eliminates nested accordion confusion, and delivers a sleek, flat SaaS layout.
- **Final State**: Clear, immediate distinction between Domestic Priority and Remote roles.

#### [HF-049] Professional SVG Vector Icon Suite Across Portal KPI Cards & Toolbars
- **Preconditions**: Web portal loaded in modern desktop or mobile browser.
- **Action**:
  1. Replace cartoonish OS emojis in KPI summary cards with responsive, crisp inline SVG icons:
     - Total Roles: Briefcase SVG vector icon.
     - Today's Batch: Lightning Zap SVG vector icon.
     - Domestic Priority: Geometric Map-Pin SVG vector icon.
     - Saved Roles: Clean Bookmark / Ribbon SVG vector icon.
  2. Search input uses crisp SVG search loupe icon instead of `🔍`.
  3. Regional filter chips and headers use crisp Map-Pin and Globe SVG icons instead of `📍` and `🌐`.
  4. SVGs inherit CSS `currentColor` dynamically with high-definition rendering on retina/high-DPI screens.
- **Expected Result**: Unified, professional SaaS visual design language with zero external font dependencies.
- **Final State**: Enterprise-grade UI aesthetics with crisp vector lines.

#### [HF-050] Removal of Redundant In-Card Regional Badges
- **Preconditions**: Portal renders jobs organized within dedicated Regional section separators (`Domestic & Regional Priority` and `Curated Global & Remote`).
- **Action**:
  1. Remove duplicate `DOMESTIC PRIORITY` and `GLOBAL REMOTE` badges from inside each individual job card.
  2. The parent regional section header provides the definitive contextual grouping, avoiding badge redundancy.
  3. Priority target company badge (`⭐ Priority Target`) is preserved in card headers when applicable.
  4. Accuracy fix: `isDomesticJob` in data exporter classifies JSearch and all India-based roles under Domestic Priority without feed bleeding.
- **Expected Result**: Cleaner card interface, reduced vertical card bulk, eliminating repetitive badge noise.
- **Final State**: Streamlined cards where roles and companies are prioritized visually.

#### [HF-051] Off-Peak Dispatch Scheduling, Self-Healing Watchdog & Once-Per-Day Guard
- **Preconditions**: Daily GitHub Actions schedule configured with primary off-peak trigger and secondary safety watchdog.
- **Action**:
  1. Primary schedule set to 7:05 AM IST (`35 1 * * *` UTC) to run in low-traffic off-peak hours.
  2. Backup watchdog schedule set to 8:35 AM IST (`05 3 * * *` UTC) as a self-healing safety net.
  3. `JobDatabase` maintains `dispatch_history` recording successful daily dispatches per profile.
  4. `hasDispatchedToday(profileId)` prevents duplicate email dispatches when the watchdog triggers if the primary run succeeded.
  5. If the primary run failed or was skipped by GitHub, the watchdog automatically dispatches the morning digest.
  6. Web portal navbar displays live "Last Synced" timestamp pill indicating exact sync time.
- **Expected Result**: Guaranteed daily execution with zero duplicate email dispatches.
- **Final State**: Robust self-healing pipeline with complete visibility.

#### [HF-052] Punctual External Dispatch Trigger & Native Cron Decommissioning
- **Preconditions**: External webhook trigger (e.g. cron-job.org) configured to dispatch workflow at 8:35 AM IST via GitHub REST API (`workflow_dispatch`).
- **Action**:
  1. Remove internal GitHub `schedule:` cron blocks (`35 1 * * *` and `5 3 * * *`) from `.github/workflows/daily_radar.yml`.
  2. Maintain `workflow_dispatch:` as the primary execution trigger for automated external webhooks and manual runs.
  3. Retain `inputs.force_dispatch` parameter so users can force email dispatches anytime.
  4. Retain `dispatch_history` and `hasDispatchedToday(profileId)` guards in `JobDatabase` for idempotent runs.
- **Expected Result**: Eliminates 7-8 hour delayed afternoon ghost runs caused by GitHub Actions shared queue delays, prevents unnecessary runner minutes consumption, and ensures punctual morning execution.
- **Final State**: Deterministic, punctual single-trigger architecture with zero ghost runs.

#### [HF-053] Direct-Career First URL Resolver in JSearch (Official Career Portals)
- **Preconditions**: Job listings returned by JSearch with `apply_options` containing direct employer career links (`is_direct: true` or matching corporate ATS domains: Workday, Greenhouse, Lever, SmartRecruiters, Taleo, Ashby, iCIMS, Phenom, Eightfold, or company `careers.*` / `jobs.*` domains).
- **Action**:
  1. Inspect `raw.apply_options` for any direct application option marked `is_direct: true` or corporate ATS domain.
  2. If found, overwrite the job's `url` with the official direct career portal link instead of aggregator URLs (LinkedIn/Indeed).
  3. Set `source` to the company's official careers designation (e.g., `Deloitte Careers`, `Cognizant Careers`, `PwC Careers`, `Workday Direct`).
  4. If no direct career link is present in `apply_options`, fall back safely to `raw.job_apply_link`.
- **Expected Result**: Job seekers are sent directly to the official company career portal to apply without intermediate aggregator friction.
- **Final State**: Clean direct employer career links prioritized across all profiles.

#### [HF-054] Direct ATS API Connectors (Greenhouse, Lever, SmartRecruiters)
- **Preconditions**: Public corporate career boards powered by Greenhouse, Lever, or SmartRecruiters (e.g. Big 4, UST Global, IBS Software, Cognizant, Postman, Razorpay, BrowserStack, Atlassian, GitLab, etc.).
- **Action**:
  1. Maintain a centralized registry `src/config/targetCompanies.ts` with company names, ATS platforms, and board slugs.
  2. Query public JSON endpoints with timeout protection:
     - Greenhouse: `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true`
     - Lever: `https://api.lever.co/v0/postings/{slug}?mode=json`
     - SmartRecruiters: `https://api.smartrecruiters.com/v1/companies/{slug}/postings`
  3. Extract job title, location, description, direct application URL, and publication timestamp.
  4. Run each candidate through standard profile matching (`processCandidateJob`):
     - Filter for India locations (Bangalore, Hyderabad, Pune, Mumbai, Gurgaon, Noida, Chennai, Kochi, etc.) or Worldwide / Remote.
     - Match experience bounds against candidate profile.
     - Skill tag via `tagSkills`.
  5. Deduplicate and persist in `jobs.db`.
- **Expected Result**: Ingests direct official career listings straight from company ATS systems with zero API keys required.
- **Final State**: High-trust official career listings directly populated into morning digests and web portal.

#### [HF-055] Dropdown Filter Controls in Toolbar & Deprecation of "Priority" Word
- **Preconditions**: Web portal loaded with active job listings across multiple profiles, dates, regions, and tracker states.
- **Action**:
  1. Replace horizontal role tab strip and segmented filter buttons with cohesive dropdown select controls in the toolbar:
     - Role Selector: `<select id="role-select">` (`All Roles (total)` + per-profile options).
     - Status Selector: `<select id="status-select">` (`All Active`, `Saved`, `Applied`).
     - Region Selector: `<select id="tier-select">` (`All Regions`, `Domestic`, `Remote`).
     - Timeline Selector: `<select id="date-select">` (`All Dates`, `Today's Batch`, `Yesterday`).
  2. Deprecate the word "Priority" across all Domestic section headers and region options (e.g. `Domestic & Regional`, `Domestic`).
  3. Reset button resets all dropdowns back to `'all'` and clears search input.
- **Expected Result**: Compact, responsive, single-tier toolbar with seamless reactive filtering.
- **Final State**: Modern SaaS dropdown controls with clean naming.

#### [HF-056] Dynamic In-Section Distinct Company Filter Dropdowns
- **Preconditions**: Domestic and Remote section header bars rendered in Grid view mode.
- **Action**:
  1. Compute the distinct list of company names present among the jobs in that section.
  2. Embed `<select class="section-company-select" data-section="...">` directly in the section header bar.
  3. Populate options with `All Companies ([Section Count])` and alphabetically sorted distinct companies with per-company job counts.
  4. Selecting a company filters only that specific section's displayed cards.
  5. Interacting with the company select invokes `event.stopPropagation()` so the section accordion does not toggle.
- **Expected Result**: Independent, granular company filtering per section driven by distinct listed jobs.
- **Final State**: Zero-clutter, dynamic company filtering directly within region headers.

#### [HF-057] Streamlined Grid-Only Architecture & View Toggle Removal
- **Preconditions**: Web portal loaded.
- **Action**:
  1. Deprecate and remove View Mode Switcher (`#view-mode-toggle`, `.view-mode-toggle`, `data-view="grid"`, `data-view="table"`) from the top navigation bar.
  2. Streamline the portal presentation to exclusively render responsive visual Grid cards.
  3. Navbar now cleanly displays brand identity and synchronization status on the left, and theme toggle on the right.
  4. Any legacy `job_radar_view_mode` in localStorage is safely ignored or cleared.
- **Expected Result**: Clean, unencumbered navbar and focused visual card browsing experience.
- **Final State**: Zero clutter, pure grid-first candidate experience.

#### [HF-058] Minimalist 2-Card KPI Velocity Bar
- **Preconditions**: Web portal loaded.
- **Action**:
  1. Remove redundant "Domestic Roles" and "My Saved Roles" cards from the hero KPI summary bar.
  2. Focus exclusively on the two essential velocity metrics:
     - `Total Active Roles` (`#kpi-total-jobs`)
     - `New in Today's Batch` (`#kpi-today-jobs`)
  3. The `.kpi-grid` renders a balanced 2-column layout that avoids duplicating the in-section Domestic counts and Status dropdown.
- **Expected Result**: Zero redundancy with region headers and status filters below; modern, high-impact summary deck.
- **Final State**: Minimalist, symmetrical velocity dashboard.

#### [HF-059] PL/SQL Developer Search Profile (Minnu - Resume-based)
- **Preconditions**: Candidate resume provided for Dilshada Sabnam (candidateName "Minnu") with 4 years experience at Cognizant in PL/SQL, Oracle SQL, Oracle ADF, Java, Power BI, Python.
- **Action**:
  1. Define `plsql-developer` profile in `src/profiles/plsqlProfile.ts`:
     - `id`: `plsql-developer`
     - `name`: `PL/SQL Developer Job Radar`
     - `candidateName`: `Minnu`
     - `recipientEmail`: `resolveProfileRecipients(env.RECIPIENT_EMAIL, env.RECIPIENT_EMAIL_PLSQL)` — strictly driven by repository secrets without hardcoded email fallbacks.
     - `excludedCompanies`: Excludes current employer `Cognizant` / `CTS`.
     - `experience`: `2 to 6 years` (excluding director, vp, intern, fresher, manager, engineering manager).
     - `queryTerms`: `['plsql developer in India', 'oracle pl sql in India', 'oracle developer in India', 'oracle adf developer in India']`.
     - `skills`: Tags `[PL/SQL]`, `[Oracle SQL]`, `[Oracle ADF]`, `[Power BI]`, `[Java]`, `[Python]`.
     - `accentColor`: `#0d9488`.
  2. Register profile in `src/profiles/profileRegistry.ts` so `getProfiles()` provides 4 active radar profiles.
  3. Enforce matching in `jobMatcher.ts` ensuring PL/SQL / Oracle developer roles match while excluding conflicting mobile/frontend stacks (Magento, Shopify, iOS, Android).
- **Expected Result**: Tailored, high-trust PL/SQL radar matching Minnu's 4-year experience profile with Cognizant exclusion.
- **Final State**: 4-profile multi-tenant Job Radar ecosystem with personalized candidate greetings and web portal integration.

#### [HF-060] Mobile-Optimized Responsive Viewport Architecture (< 640px)
- **Preconditions**: Web portal loaded on mobile viewport or touchscreen device (< 640px width, e.g. 360px–480px smartphones).
- **Action**:
  1. Top Navbar: Remains a single-row flex layout (`flex-direction: row; justify-content: space-between; align-items: center;`) with compact brand logo on left and `#theme-toggle` on right, avoiding vertical stacking.
  2. Hero & KPI Deck: `.kpi-grid` renders a compact side-by-side 2-column grid (`grid-template-columns: repeat(2, 1fr)`) with streamlined padding (`12px 14px`) and 18px icons, preserving above-the-fold listing visibility.
  3. Filter Toolbar & Dropdowns:
     - Search input spans full width (100%), and desktop keyboard shortcut badge (`/`) is hidden on mobile.
     - The 4 filter dropdowns (`#role-select`, `#status-select`, `#tier-select`, `#date-select`) form a balanced 2x2 grid (`grid-template-columns: repeat(2, 1fr)`) with touch-friendly minimum height (42px) and zoom-safe font sizes (≥ 13.5px / 14px) preventing iOS Safari involuntary auto-zoom.
     - Reset filter button spans full width below the dropdown grid when active.
  4. Regional Section Headers (`.tier-header-bar`):
     - Stacks into a 2-tier responsive structure:
       - Row 1: Section title, verified count badge, and collapse chevron.
       - Row 2: In-section company dropdown (`.section-company-select`) expanding to full width (100%) with 40px+ tap height and isolated click handlers (`stopPropagation`).
  5. Job Cards & Action Buttons:
     - Card padding adjusted to `16px` with fluid action buttons ("Save", "Applied", "Apply Now ↗") offering min 38-42px touch targets.
  6. Slide-Over Detail Drawer (`.job-drawer`):
     - Transitions to a mobile bottom sheet / full-screen drawer sliding up from the bottom (`transform: translateY(...)`) with safe-area bottom padding (`env(safe-area-inset-bottom)`).
- **Expected Result**: Thumb-friendly, fast, zero-side-sway mobile experience without awkward multiline wrapping or iOS auto-zoom glitches.
- **Final State**: Native app-like responsive mobile candidate experience.

#### [HF-061] Progressive Web App (PWA) Offline Engine & Web Manifest
- **Preconditions**: Static web portal deployment in `docs/`.
- **Action**:
  1. Create Web App Manifest (`manifest.webmanifest`) declaring `name: "Job Radar Portal"`, `short_name: "Job Radar"`, `start_url: "./"`, `display: "standalone"`, `theme_color: "#090d16"`, `background_color: "#090d16"`, and SVG icon definitions.
  2. Embed PWA meta tags in `template.html`:
     - `<meta name="theme-color" content="#090d16">`
     - `<meta name="apple-mobile-web-app-capable" content="yes">`
     - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
     - `<meta name="apple-mobile-web-app-title" content="Job Radar">`
     - `<link rel="apple-touch-icon" href="favicon.svg">`
     - `<link rel="manifest" href="manifest.webmanifest">`
  3. Provide Service Worker (`sw.js`) that pre-caches app shell assets (`./`, `index.html`, `styles.css`, `app.js`, `favicon.svg`, `manifest.webmanifest`, `jobs.json`) with stale-while-revalidate / cache-first offline support.
  4. Register Service Worker gracefully in `app.ts` (`'serviceWorker' in navigator && window.location.protocol.startsWith('http')`).
  5. `portalPageBuilder.ts` generates `docs/manifest.webmanifest` and `docs/sw.js` alongside existing assets.
- **Expected Result**: Installable PWA with home screen badge, standalone window presentation, and resilient offline capability.
- **Final State**: Full Progressive Web App capability for mobile and desktop candidate usage.

#### [HF-062] Fixed Pinned Navigation Header Across Viewports
- **Preconditions**: Web portal loaded on any viewport (desktop, tablet, or mobile).
- **Action**:
  1. Top navigation bar (`.top-navbar`) applies `position: fixed; top: 0; left: 0; right: 0; width: 100%; z-index: 90;` with frosted glass backdrop blur.
  2. Hero container (`.hero-container`) applies top offset spacing (`padding-top: 84px` desktop, `72px` mobile) so content starts cleanly below the fixed header without overlap.
- **Expected Result**: Header remains permanently anchored at the top of the viewport during all scrolling.
- **Final State**: Persistent navigation accessibility across all screen sizes.

#### [HF-063] Minimalist Single-Line Candidate Intelligence Footer
- **Preconditions**: Web portal loaded.
- **Action**:
  1. Portal renders a small, elegant footer (`.portal-footer`) at the bottom of the page.
  2. Displays a single clean brand line: `Job Radar Portal • Automated Candidate Intelligence`.
  3. Omits verbose sublines and clutter.
  4. Includes mobile safe-area padding (`env(safe-area-inset-bottom)`) and theme-adaptive glass styling.
- **Expected Result**: Clean structural grounding for the bottom of the feed without visual clutter.
- **Final State**: Complete, polished web application aesthetic.

---

### Negative Flows

#### [NF-001] Negative Filter Exclusion
- **Preconditions**: Listings containing negative keywords ("unpaid", "internship", "data entry", "excel only", "recruiter spam").
- **Action**: Negative filter inspects title and description.
- **Expected Result**: Jobs containing negative filters are dropped.
- **Final State**: Zero spam/unpaid jobs in the ingestion pipeline.

#### [NF-002] Graceful Upstream Failure
- **Preconditions**: One API endpoint is down, returns 500, or times out.
- **Action**: Scraper queries all endpoints concurrently with `Promise.allSettled`.
- **Expected Result**: Failed endpoint logs warning; successful endpoints continue processing.
- **Final State**: Pipeline completes with available data from working feeds.

#### [NF-003] Missing Environment Credentials Validation
- **Preconditions**: Missing `SENDER_EMAIL`, `SENDER_PASSWORD`, or `RECIPIENT_EMAIL`.
- **Action**: Mailer verifies environment before attempting connection.
- **Expected Result**: Fails fast with clear diagnostic message.
- **Final State**: Execution halts cleanly with code 1.

#### [NF-004] Isolated Profile Execution Failure
- **Preconditions**: An error occurs during processing of one profile (e.g. invalid template or specific feed issue).
- **Action**: Main orchestrator uses `try/catch` per profile.
- **Expected Result**: The error is logged and the remaining profiles continue processing.
- **Final State**: Pipeline resilience across multiple recipients.

#### [NF-005] Experience Level Mismatch Exclusion
- **Preconditions**: Job requiring 10+ years (overqualified) or 0-1 years internship (underqualified) for a 2-6 years profile.
- **Action**: Experience matcher checks detected years against profile range.
- **Expected Result**: Job is rejected and dropped from ingestion.
- **Final State**: Only experience-appropriate roles retained.

#### [NF-006] Excluded Seniority Title Rejection
- **Preconditions**: Job with title containing "Director", "VP", "Vice President", "Head of", or "Principal".
- **Action**: Experience matcher inspects job title against `profile.experience.excludedSeniority`.
- **Expected Result**: Job is rejected even if no explicit years are mentioned.
- **Final State**: Excluded leadership/fresher roles dropped.

#### [NF-007] Junior Power Platform Role Rejection (Celine - requires 3+ years)
- **Preconditions**: Job requiring 1-2 years experience for Power Platform profile (minYears: 3).
- **Action**: Experience matcher compares required max years against profile minYears.
- **Expected Result**: Job requiring 1-2 years is rejected as below the 3-year threshold.
- **Final State**: Only mid-to-senior roles delivered.

#### [NF-008] Per-Profile Company Exclusions
- **Preconditions**: Profiles configured with specific excluded companies:
  - Celine (`power-platform`): `Wipro`
  - Aswin (`java-backend`): `TCS` (and "Tata Consultancy Services")
  - Vishnu (`full-stack`): `EY` (and "Ernst & Young")
- **Action**: Ingestion filter checks candidate company name against profile's `excludedCompanies` list.
- **Expected Result**: Any job from an excluded company is dropped from ingestion, even if matching skills and experience.
- **Final State**: Zero listings from excluded employers delivered to that profile.

#### [NF-009] Conflicting Tech Stack & Recruiter Keyword Stuffing Exclusion
- **Preconditions**: Candidate job with title denoting an unrelated tech stack (e.g. "Senior Magento Developer", "PHP Developer", "WordPress Developer", "Shopify Developer", "Drupal Developer", "iOS Developer", "Salesforce Developer") where the recruiter body mentions "Java", "Python", or "Angular" in passing.
- **Action**: Profile matcher inspects job title against `excludedTitleKeywords` before evaluating body text.
- **Expected Result**: Rejects the job outright due to title conflict. Prevents irrelevant CMS, PHP, or mobile roles from leaking into Java or Full Stack profiles.
- **Final State**: Candidate only receives roles fundamentally aligned with their target stack.

#### [NF-010] Empty Database Portal Rendering Resilience
- **Preconditions**: Database is empty or 0 jobs exist within the 60-day window.
- **Action**: Portal exporter and page builder execute.
- **Expected Result**: Generates a clean, friendly empty state with helpful status indicators rather than throwing null-reference or file generation errors.
- **Final State**: Graceful zero-data handling.

#### [NF-011] Slide-Over Drawer Escape & Overlay Trap Resilience
- **Preconditions**: Drawer open displaying job details.
- **Action**: User presses Escape key or clicks anywhere on dark backdrop overlay.
- **Expected Result**: Drawer smoothly dismisses and unfreezes body scroll without throwing JavaScript runtime errors.
- **Final State**: Robust modal state lifecycle.

---

### Edge Cases

#### [EC-001] Pan-India IT Parks & Tech Hubs Location Normalizer
- **Preconditions**: Job locations specifying Indian IT parks and tech hubs across India:
  - Kochi & Kerala: "Kochi", "Cochin", "Infopark", "Technopark", "Trivandrum", "Kerala"
  - Bengaluru: "Bangalore", "Bengaluru", "Whitefield", "Electronic City", "Manyata"
  - Hyderabad: "Hyderabad", "HITEC City", "Cyberabad", "Gachibowli", "Telangana"
  - Pune: "Pune", "Hinjawadi", "Magarpatta", "Kharadi", "Maharashtra"
  - Chennai: "Chennai", "OMR", "Tidel Park", "Guindy", "Tamil Nadu"
  - Delhi NCR: "Noida", "Gurugram", "Gurgaon", "Delhi", "NCR"
  - Mumbai, Kolkata, Coimbatore, Ahmedabad GIFT City
  - Pan-India: "India", "Remote - India", "India (Hybrid)", "Worldwide Remote", "Anywhere"
- **Action**: Location matcher evaluates geographic tokens against all Indian IT park hubs.
- **Expected Result**: Correctly accepts Indian IT park locations and global remote listings; rejects regional exclusions (e.g., "US Remote Only", "UK Only", "Europe Only").
- **Final State**: Accurate geographic filtering covering all major Indian tech corridors.

#### [EC-002] Special Characters in Job Titles & Descriptions
- **Preconditions**: Job titles containing HTML entities or characters (`&`, `<`, `>`, `"`, `'`, `/`).
- **Action**: Template generator sanitizes job title and company fields before injecting into HTML.
- **Expected Result**: Clean rendering without broken HTML layout or XSS risks.
- **Final State**: Properly escaped HTML document.

#### [EC-003] Cross-Feed Duplicate Detection
- **Preconditions**: Same job posted across multiple boards with slightly different URL tracking parameters.
- **Action**: Deduplicator normalizes URLs (strips query parameters).
- **Expected Result**: Only 1 instance of the job is kept.
- **Final State**: No redundant listings in the email digest.

#### [EC-004] .NET and C# Boundary Matching
- **Preconditions**: Text mentioning ".NET", "C#", "ASP.NET", ".NET 8", "dotnet" vs words ending in "net" like "internet" or "network".
- **Action**: Regex parser uses word boundaries and specific pattern checks.
- **Expected Result**: Correctly tags `[.NET]` without false positive triggers on "network" or "internet".
- **Final State**: Accurate skill identification.

#### [EC-005] Multiple Profiles Sent to Same Email Address
- **Preconditions**: Both profiles configured with identical `recipientEmail` (current user configuration).
- **Action**: Mailer sends 2 distinct emails with unique subject lines and branding.
- **Expected Result**: Recipient receives both "✨ Power Platform Job Radar" and "✨ Full Stack Developer Job Radar" emails clearly separated.
- **Final State**: 2 distinct digest emails delivered.

#### [EC-006] Java Boundary Matching (Java vs JavaScript)
- **Preconditions**: Job descriptions containing "JavaScript" or "TypeScript" without Java.
- **Action**: Regex parser uses word boundaries `\bjava\b`.
- **Expected Result**: Does NOT tag `[Java]` when only "JavaScript" is mentioned.
- **Final State**: Zero false positive tags on JavaScript roles.

#### [EC-007] Multi-Pattern Experience Extraction
- **Preconditions**: Experience requirements phrased in diverse formats: "3+ years", "3-5 years", "minimum 4 years of experience", "2 to 4 years".
- **Action**: Experience parser extracts `minYears` and `maxYears`.
- **Expected Result**: Accurately determines numerical bounds without false positives on calendar years (e.g. "since 2020").
- **Final State**: Robust numerical bounds extracted for filtering.

#### [EC-008] Company Name Alias & Word Boundary Matching
- **Preconditions**: Company names containing short acronyms (e.g., "EY", "TCS") or corporate suffixes (e.g., "Wipro Technologies", "Tata Consultancy Services Ltd", "Ernst & Young LLP").
- **Action**: Exclusion and target company matchers use regex word boundaries and alias mapping.
- **Expected Result**:
  - Excludes "EY" and "Ernst & Young" without falsely matching words like "Honey", "EyeCare", or "Journey".
  - Excludes "TCS" and "Tata Consultancy Services" without falsely matching unrelated words.
  - Excludes "Wipro" and "Wipro Limited".
- **Final State**: Precise company matching without false positive drops.

#### [EC-013] Recipient Deduplication and Formatting
- **Preconditions**: `RECIPIENT_EMAIL` and `RECIPIENT_EMAIL_<PROFILE>` are identical or differ only in casing/whitespace (e.g. `user@example.com` and `USER@example.com`).
- **Action**: Recipient resolver deduplicates case-insensitively and trims extraneous whitespace and characters.
- **Expected Result**: Email is sent to a single recipient (`user@example.com`), avoiding duplicate deliveries to the same inbox.
- **Final State**: Clean, deduplicated `to` header.

#### [EC-014] Freshness-First Priority within Tiers
- **Preconditions**: Both today's newly scraped jobs and yesterday's rolled-over jobs exist within the same tier (e.g. JSearch).
- **Action**: Within the same priority tier, sorter orders jobs by `scrapedAt DESC`.
- **Expected Result**: Today's freshest openings always display ahead of older unemailed backlog.
- **Final State**: Freshest roles appear first in digest.

#### [EC-015] Dynamic Section Fill (Domestic Cap with Global Remote Backfill)
- **Preconditions**: One category has fewer jobs than its default allotment (e.g. domestic has only 3 jobs, or 0 jobs on weekends).
- **Action**: Sorter dynamically allows the other category to backfill up to the total email cap (15 jobs).
- **Expected Result**: Candidate receives a full, high-quality digest without empty slots or dead sections.
- **Final State**: Robust digest rendering across all volume scenarios.

#### [EC-016] Missing Placeholder Graceful Handling
- **Preconditions**: A template file contains an unassigned placeholder or dynamic data is missing a field.
- **Action**: Template renderer cleans up unreplaced tokens or replaces with empty string.
- **Expected Result**: Output does not display raw `{{unmatchedToken}}` in candidate-facing emails.
- **Final State**: Polished email presentation with zero syntax leakage.

#### [EC-017] Secure HTML Escaping across Template Boundary
- **Preconditions**: Job fields or candidate names containing raw HTML characters (`<`, `>`, `&`, `"`).
- **Action**: Template engine escapes values before token injection into HTML templates.
- **Expected Result**: Prevents HTML structure breakage and sanitizes all external text.
- **Final State**: 100% XSS-safe email generation.

#### [EC-020] Fresh Backlog Protection & Absolute 60-Day Purge
- **Preconditions**: Both fresh unemailed jobs (0-48h old) and stale jobs (> 60 days old) in database.
- **Action**: Retention pruning deletes any job where `scraped_at < datetime('now', '-60 days')`. Fresh unemailed jobs (0-48h old) remain in the active queue untouched.
- **Expected Result**: Active dispatch pipeline is preserved for fresh jobs, while all records older than 60 days are unconditionally wiped out.
- **Final State**: Zero stale jobs > 60 days survive, while daily fresh queues operate normally.

#### [EC-021] Self-Contained Offline & Local Storage Resilience
- **Preconditions**: User opens `docs/index.html` locally via `file://` protocol or in an environment where `localStorage` is restricted or partitioned.
- **Action**: Portal script embeds initial JSON data as inline bootstrap fallback and wraps storage calls in safe `try/catch`.
- **Expected Result**: Page renders smoothly without CORS errors or uncaught security exceptions when saving/viewing roles.
- **Final State**: Bulletproof offline and online resilience.

#### [EC-022] Multi-Day Chronological Grouping & Tier Partitioning
- **Preconditions**: Jobs in database spanning multiple days with mix of sources (JSearch LinkedIn/Naukri vs Remotive/Jobicy).
- **Action**: Data exporter groups listings by date (`scraped_at`), prioritizing Today's roles at the top, and partitions each date into Domestic Priority vs Global Remote tiers.
- **Expected Result**: Today's jobs are indexed first, and each date view renders dedicated domestic vs remote sections.
- **Final State**: Perfect mirror of email tier hierarchy across the entire 60-day historical window.

#### [EC-023] Mobile Bottom Sheet Background Scroll Lock & Active Touch Interception
- **Preconditions**: Candidate opens job detail drawer/bottom sheet on mobile or touch viewport with the page scrolled down.
- **Action**:
  1. System locks background scroll via `drawer-open` class on both `document.documentElement` and `document.body` (`position: fixed; width: 100%; height: 100%; overflow: hidden; touch-action: none;`).
  2. Preserves exact scroll offset (`scrollPosition = window.pageYOffset || document.documentElement.scrollTop; document.body.style.top = -${scrollPosition}px;`).
  3. Attaches an active document-level `touchmove` listener (`{ passive: false }`) that calls `e.preventDefault()` on any touch gesture outside `.drawer-body`.
  4. Applies rubber-band boundary clamp on `.drawer-body` touchstart to prevent iOS Safari gesture pass-through to document root.
  5. Applies `overscroll-behavior: contain` to `.drawer-body` and `.job-drawer`.
  6. Upon closing drawer, removes `drawer-open`, clears `document.body.style.top`, removes `touchmove` listener, and restores window scroll position (`window.scrollTo(0, scrollPosition)`).
- **Expected Result**: 100% frozen background on iOS Safari and mobile touch browsers with zero background movement while browsing drawer content; smooth restoration upon close.
- **Final State**: Flawless mobile modal sheet scroll containment adhering to mobile HIG standards.

#### [EC-024] High-Density Mobile & Responsive Viewport Adaptability
- **Preconditions**: Mobile device or small screen viewport (< 640px).
- **Action**: Responsive CSS adjusts layout seamlessly:
  1. Sticky navigation wraps controls cleanly into a touch-friendly toolbar.
  2. Grid cards scale to full width (1-column).
  3. Detail drawer expands to 100% full screen with sticky bottom CTA.
  4. Table list view scrolls horizontally or cleanly formats to cards.
- **Expected Result**: 100% responsive without horizontal layout breakages or clipped text.
- **Final State**: Flawless experience on mobile, tablet, and desktop.

---

### Validation Rules
- `VR-001`: Every job must have non-empty `title`, `company`, and valid `url` (starting with `http://` or `https://`).
- `VR-002`: Skill tags must contain at least one valid tag.
- `VR-003`: Email address format validation for sender and recipient.
- `VR-004`: Each `JobProfile` must have unique `id`, non-empty `name`, `recipientEmail`, and search keywords.
- `VR-005`: Profile experience configuration must ensure `minYears <= maxYears` when both are defined.

---

### Loading / State Transitions
- `ST-001`: SQLite database initialization creates table `jobs` with `profile_id` column.
- `ST-002`: Pipeline progression: `IDLE` -> `FOR_EACH_PROFILE` -> `FETCHING_FEEDS` -> `FILTERING_AND_TAGGING` -> `DEDUPLICATING` -> `GENERATING_EMAIL` -> `DISPATCHING_SMTP` -> `PERSISTING_DB` -> `COMPLETE`.
- `ST-003`: Migration check: If `jobs` table exists without `profile_id`, adds `profile_id` column automatically.

---

### Recovery / Retry
- `RR-001`: Transient HTTP fetch errors retry up to 2 times with a 1-second delay before falling back.
- `RR-002`: Persistent deduplication integrity: If mail dispatch fails, new jobs remain marked as unemailed so they are not permanently lost.

---

### Authentication / Authorization
- `AUTH-001`: Dedicated Gmail SMTP (`smtp.gmail.com:465` with 16-character Google App Passwords) for direct multi-recipient delivery without forwarding authorization. Configurable via `SENDER_EMAIL`, `SENDER_PASSWORD`, and optional `SMTP_HOST` / `SMTP_PORT`. Resend and Brevo implementations removed.

---

### Regression Requirements
- `REG-001`: Consecutive pipeline execution with identical feed data must yield 0 new jobs on the second run and send the 0-job status digest.
- `REG-002`: Multi-profile pipeline execution across all configured profiles (Power Platform, Full Stack, Java Backend) maintains independent deduplication state.
- `REG-003`: Modular Domain Architecture & Explicit Naming: Codebase is organized into clean domain modules (`src/profiles/`, `src/scrapers/`, `src/filters/`, `src/email/`, `src/db/`) with self-describing filenames (`profileRegistry.ts`, `powerPlatformProfile.ts`, `fullStackProfile.ts`, `javaBackendProfile.ts`, `scraperCoordinator.ts`, `jobDatabase.ts`, `emailTemplate.ts`, etc.) and zero duplicate wrapper files. All test suites, CLI entry points, and workflows run with 100% test coverage and zero TypeScript resolution errors.
- `REG-004`: Centralized API Endpoints & Feeds Registry: All external job board APIs (JSearch, Adzuna India, Remotive, Jobicy, Arbeitnow, RemoteOK) and RSS feeds (WeWorkRemotely, Himalayas, NoDesk) are centralized in `src/constants/apiEndpoints.ts` for unified maintainability. Workflow is named `Multi-Profile Job Radar`.
