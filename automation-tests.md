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

#### [HF-021] Smart Digest Capping (Top 15 Roles & Overflow Indicator)
- **Preconditions**: Profile matches more than 15 jobs in a single scan (e.g., 52 Full Stack jobs).
- **Action**:
  - Template generator sorts priority target companies first, then slices the list to the Top 15 roles (`maxJobs = 15`).
  - Renders a clean overflow summary badge below the job cards: `+ X additional roles identified today • Showing top 15 priority matches`.
  - Appends overflow summary note in plain-text alternative.
  - Mailer includes standard automated headers (`Auto-Submitted: auto-generated`, `X-Auto-Response-Suppress: OOF, AutoReply`).
  - Main dispatcher introduces a 2-second throttling pause between profile email dispatches to prevent SMTP burst flags.
- **Expected Result**:
  - Exactly 15 job cards rendered in HTML and listed in text when count > 15.
  - Email payload remains compact (< 35 KB) and outbound links capped at 15, preventing Gmail 102 KB message clipping and link-spam heuristic penalties.
  - All jobs <= 15 are rendered completely without overflow badge.
- **Final State**: Highly deliverable, reader-friendly daily digest delivered directly to inbox.

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
