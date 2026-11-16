# ⚡ Power Platform Job Radar

An automated daily job scanner built in Node.js & TypeScript that searches free, public feeds every morning for fresh **Power Apps & Power Platform** developer jobs in **India & Worldwide Remote**, filters out non-tech spam, smart-tags core skills, deduplicates via SQLite, and dispatches a responsive HTML email digest to your inbox via Gmail SMTP.

**Runs 100% free, 24/7 in the cloud via GitHub Actions — zero PC uptime and zero paid APIs required.**

---

## 🌟 Key Features

- **Free Job Feeds**: Queries public APIs and endpoints including Remotive, Jobicy, Arbeitnow, and tech RSS feeds.
- **Smart Skill Tagging**: Automatically detects and tags:
  - `[Canvas Apps]`
  - `[Model-Driven]`
  - `[Dataverse]`
  - `[PCF]`
  - `[Power Automate]`
  - `[Copilot Studio]`
  - `[Power Pages]`
  - `[Dynamics 365]`
- **Target Location Matching**: Focuses on jobs in **India** (Bangalore, Hyderabad, Pune, Mumbai, Delhi-NCR, etc.) and **Worldwide Remote / Anywhere**. Rejects US/EU-only listings.
- **Negative Spam Filters**: Drops data-entry gigs, Excel-only jobs, unpaid internships, and recruiter spam.
- **Deduplication Engine**: Backed by a persistent SQLite database (`jobs.db`). Once a job is emailed, you will never see it again.
- **Responsive HTML Digest**: Custom email design with cards, status badges, skill pills, and `[Apply Now ↗]` buttons.
- **0-Job Status Heartbeat**: If no new jobs are posted on a given morning, sends a clean status notification ("0 New Roles Found Today - Radar active & scanning") so you know the automation ran successfully.
- **24/7 Cloud Automation**: Pre-configured GitHub Actions workflow runs every morning at **8:30 AM IST (03:00 UTC)** and commits `jobs.db` back to the repository.

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

## 🔑 Step 1: Generate a Free Google "App Password"

To send automated emails through Gmail without compromising your master password, Google provides dedicated 16-character **App Passwords**.

> **Note**: Your Google account must have **2-Step Verification** turned on.

1. Go to your Google Account security settings: [https://myaccount.google.com/security](https://myaccount.google.com/security).
2. Under the **"How you sign in to Google"** section, ensure **2-Step Verification** is enabled.
3. In the search bar at the very top of your Google Account page, type: **`App passwords`** and select it (or navigate directly to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. Under **"App name"**, enter a friendly label such as `Job Radar` and click **Create**.
5. Google will display a yellow box with a **16-character code** (e.g. `abcd efgh ijkl mnop`).
6. **Copy this 16-character code** (the spaces do not matter; our code automatically cleans them). This is your `SENDER_PASSWORD`.

---

## 🔒 Step 2: Add Secrets to GitHub

To allow GitHub Actions to run securely without hardcoding your email credentials into git:

1. Open your repository on GitHub: `https://github.com/Vishnu1562/Job_Bot`.
2. Click on **Settings** (tab at the top right of the repository).
3. In the left sidebar, click **Secrets and variables** &rarr; **Actions**.
4. Click the green **New repository secret** button and add these three secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SENDER_EMAIL` | The Gmail address sending the digest | `your-email@gmail.com` |
| `SENDER_PASSWORD` | The 16-character Google App Password | `abcdefghijklmnop` |
| `RECIPIENT_EMAIL` | The email address where you want to receive digests | `destination@gmail.com` |

5. **Ensure Workflow Write Permissions**:
   - In your repo settings, go to **Actions** &rarr; **General**.
   - Scroll down to **Workflow permissions**.
   - Select **"Read and write permissions"** and click **Save**. (This allows the bot to commit `jobs.db` back to the repository so it never re-emails the same jobs).

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
