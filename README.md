# ⚡ Multi-Profile Job Radar (Power Platform & Full Stack)

An automated daily job scanner built in Node.js & TypeScript that searches free, public feeds every morning for fresh developer jobs in **India & Worldwide Remote**, filters out non-tech spam, smart-tags core skills, deduplicates via SQLite, and dispatches responsive HTML email digests to their respective recipients.

**Runs 100% free, 24/7 in the cloud via GitHub Actions — zero PC uptime and zero paid APIs required.**

---

## 🌟 Supported Search Profiles

The radar includes three pre-configured profiles out of the box and is built to be easily expandable:

1. **Power Platform Job Radar**:
   - Focus: Power Apps, Power Automate, Dataverse, PCF, Copilot Studio, Power Pages, Dynamics 365.
   - Skill Tags: `[Canvas Apps]`, `[Model-Driven]`, `[Dataverse]`, `[PCF]`, `[Power Automate]`, `[Copilot Studio]`, `[Power Pages]`, `[Dynamics 365]`.
   - Recipient: `RECIPIENT_EMAIL_POWERPLATFORM` (or falls back to `RECIPIENT_EMAIL`).

2. **Full Stack Developer Job Radar**:
   - Focus: Full Stack / Backend / Frontend developer positions.
   - Target Tech Stack: NestJS, Angular, .NET, PostgreSQL, MSSQL, Azure DevOps, GitHub.
   - Skill Tags: `[NestJS]`, `[Angular]`, `[.NET]`, `[PostgreSQL]`, `[MSSQL]`, `[Azure DevOps]`, `[GitHub]`.
   - Recipient: `RECIPIENT_EMAIL_FULLSTACK` (or falls back to `RECIPIENT_EMAIL`).

3. **Java & Spring Boot Developer Job Radar**:
   - Focus: Enterprise Java Backend / Core Banking / Microservices developer positions.
   - Target Tech Stack: Java, Spring Boot, Hibernate, JPA, Microservices, REST APIs, Oracle SQL, PostgreSQL, Docker, Spring Security.
   - Skill Tags: `[Spring Boot]`, `[Java]`, `[Hibernate/JPA]`, `[Microservices]`, `[REST APIs]`, `[Oracle SQL]`, `[PostgreSQL]`, `[Docker]`, `[Spring Security]`, `[React]`.
   - Recipient: `RECIPIENT_EMAIL_JAVA` (or falls back to `RECIPIENT_EMAIL`).

---

## 🚀 How to Add New Search Profiles in the Future

The architecture is 100% modular and scalable. To add a 3rd or 4th profile (e.g. "DevOps / SRE" or "Data Engineer"):
1. Open [`src/config/profiles.ts`](file:///d:/Projects/Job_Bot/src/config/profiles.ts).
2. Add a new profile definition to the `getProfiles()` array:
```ts
{
  id: 'devops-sre',
  name: 'DevOps & SRE Job Radar',
  recipientEmail: env.RECIPIENT_EMAIL_DEVOPS || defaultRecipient,
  queryTerms: ['devops', 'sre', 'kubernetes', 'terraform'],
  keywords: ['devops', 'sre', 'site reliability', 'cloud engineer'],
  skills: [
    { tag: '[Kubernetes]', patterns: ['kubernetes', /\bk8s\b/i] },
    { tag: '[Terraform]', patterns: ['terraform'] },
    { tag: '[AWS]', patterns: [/\baws\b/i, 'amazon web services'] },
    { tag: '[Docker]', patterns: ['docker', 'containers'] }
  ],
  defaultTag: '[DevOps]',
  accentColor: '#10b981'
}
```
That's it! The workflow will automatically pick up the new profile, query feeds for its keywords, track deduplication in `jobs.db`, and send a dedicated digest to its recipient.

---

## 📁 Project Architecture

```
Job_Bot/
├── .github/
│   └── workflows/
│       └── daily_radar.yml    # GitHub Actions 8:30 AM IST cron workflow
├── src/
│   ├── types.ts               # Data types and interfaces
│   ├── filter.ts              # Power Platform keywords & India location filters
│   ├── tagger.ts              # Regex skill extractor for Power Platform components
│   ├── db.ts                  # SQLite persistent deduplication engine
│   ├── scraper.ts             # Multi-source scraper (Remotive, Jobicy, Arbeitnow, RSS)
│   ├── emailTemplate.ts       # Responsive HTML email digest generator
│   ├── mailer.ts              # Gmail SMTP dispatcher (smtp.gmail.com:587)
│   └── index.ts               # Main CLI orchestrator
├── test/
│   ├── db.test.ts             # TDD tests for SQLite storage
│   ├── emailTemplate.test.ts  # TDD tests for HTML generation & escaping
│   ├── filter.test.ts         # TDD tests for filters & URL normalization
│   ├── mailer.test.ts         # TDD tests for environment validation
│   ├── scraper.test.ts        # TDD tests for feed parsers
│   └── tagger.test.ts         # TDD tests for skill tags
├── automation-tests.md        # Behavioral specification & test contract
├── package.json               # Dependencies & test scripts
├── tsconfig.json              # TypeScript configuration
├── .gitignore                 # Safe git exclusion rules
└── README.md                  # Setup & documentation guide
```

---

## 🔑 Step 1: Get Free SMTP Credentials from Brevo (2 Minutes, No Credit Card)

Brevo provides a **100% free forever tier** with 300 free emails per day and direct SMTP relay access without needing Google App Passwords:

1. Sign up for free at [**https://www.brevo.com/**](https://www.brevo.com/) (Click **Sign up free** — no credit card needed).
2. Once inside your dashboard, go to the SMTP Settings page: [**https://app.brevo.com/settings/keys/smtp**](https://app.brevo.com/settings/keys/smtp).
3. On the **SMTP** tab, note your:
   - **Login**: (e.g. `yourname@gmail.com` or your login ID). This is your `SENDER_EMAIL`.
4. Click the blue **"Generate a new SMTP key"** button.
5. Name it `Job Radar` and click **Generate**.
6. **Copy the generated key**. This is your `SENDER_PASSWORD`.

---

## 🔒 Step 2: Add Secrets to GitHub

To allow GitHub Actions to run securely without exposing credentials:

1. Open your repository on GitHub: [`https://github.com/Vishnu1562/Job_Bot`](https://github.com/Vishnu1562/Job_Bot).
2. Go to **Settings** (tab at the top right) &rarr; **Secrets and variables** (left sidebar) &rarr; **Actions**.
3. Click the green **New repository secret** button and add these three secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SENDER_EMAIL` | Your Brevo SMTP login email | `your-brevo-login@gmail.com` |
| `SENDER_PASSWORD` | The Brevo SMTP key generated in Step 1 | `xsmtpsib-...` |
| `RECIPIENT_EMAIL` | Your personal email where you want to receive digests | `your.inbox@gmail.com` |

4. *(Optional)* If you ever want to switch back to Gmail or Outlook later, you can also add `SMTP_HOST` (e.g. `smtp.gmail.com`). By default, it automatically uses Brevo (`smtp-relay.brevo.com`).

5. **Enable Workflow Write Permissions**:
   - In repository **Settings** &rarr; **Actions** &rarr; **General**.
   - Scroll down to **Workflow permissions**.
   - Select **"Read and write permissions"** and click **Save**. (This allows the bot to commit `jobs.db` back to git so duplicate jobs are never sent twice).

---

## 🚀 Step 3: Enable & Test the Workflow

Once your code is pushed to GitHub with the secrets configured:

1. Click on the **Actions** tab in your GitHub repository.
2. Under "Workflows" on the left, click **Power Platform Job Radar**.
3. Click the **Run workflow** dropdown on the right and select the `main` branch.
4. Click the green **Run workflow** button.
5. In ~30-45 seconds, the workflow will finish, and you'll receive your first **Power Platform Job Radar** email!

---

## 💻 Local Development & Testing

You can run and test everything locally anytime:

### 1. Run Unit Tests (Strict TDD Suite)
```bash
npm test
```
All 27 automated tests across 10 suites will execute using Node's native test runner.

### 2. Run a Dry Run (No Email Sent, Writes HTML Preview)
```bash
npm start -- --dry-run
```
This fetches the live feeds, performs deduplication, and generates `preview_digest.html` in your root directory. Open it in any browser to inspect the email styling!

### 3. Run Live Locally with `.env`
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Fill in your credentials, then run:
```bash
npm start
```

---

## 📄 License
MIT License. Free to use, adapt, and share.
