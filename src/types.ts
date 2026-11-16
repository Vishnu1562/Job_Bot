export interface RawJobListing {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  source?: string;
  publishedAt?: string;
}

export interface Job {
  id: string;
  profileId?: string;
  title: string;
  company: string;
  location: string;
  url: string;
  tags: string[];
  source: string;
  description: string;
  publishedAt?: string;
  scrapedAt?: string;
}

export interface SkillRule {
  tag: string;
  patterns: (string | RegExp)[];
}

export interface ExperienceConfig {
  minYears?: number;
  maxYears?: number;
  excludedSeniority?: string[];
}

export interface JobProfile {
  id: string;
  name: string;
  recipientEmail: string;
  experience?: ExperienceConfig;
  queryTerms: string[];
  keywords: (string | RegExp)[];
  skills: SkillRule[];
  defaultTag: string;
  negativeKeywords?: string[];
  accentColor?: string;
}

export interface MailerConfig {
  senderEmail: string;
  senderPassword: string;
  recipientEmail: string;
  smtpHost: string;
  smtpPort: number;
  fromEmail: string;
  authUser: string;
}
