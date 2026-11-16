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

export interface MailerConfig {
  senderEmail: string;
  senderPassword: string;
  recipientEmail: string;
  smtpHost: string;
  smtpPort: number;
  fromEmail: string;
  authUser: string;
}
