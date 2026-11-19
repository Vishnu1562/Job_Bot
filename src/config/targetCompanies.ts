/**
 * Centralized Target Companies Registry.
 * Defines enterprise IT giants, Big 4 consultancies, and top high-growth tech firms
 * with their respective ATS platforms and public endpoints for direct career ingestion.
 */

export type AtsPlatform = 'greenhouse' | 'lever' | 'smartrecruiters' | 'workday' | 'direct';

export interface TargetCompany {
  name: string;
  ats: AtsPlatform;
  slug: string;
  careersUrl?: string;
  category?: 'big4' | 'enterprise_it' | 'tech_unicorn' | 'global_enterprise';
}

export const TARGET_COMPANIES: TargetCompany[] = [
  // --- Big 4 & Advisory Firms ---
  { name: 'Deloitte', ats: 'direct', slug: 'deloitte', careersUrl: 'https://careers.deloitte.com', category: 'big4' },
  { name: 'PwC', ats: 'workday', slug: 'pwc', careersUrl: 'https://pwc.wd3.myworkdayjobs.com', category: 'big4' },
  { name: 'EY', ats: 'direct', slug: 'ey', careersUrl: 'https://careers.ey.com', category: 'big4' },
  { name: 'KPMG', ats: 'smartrecruiters', slug: 'KPMG', careersUrl: 'https://kpmg.com/careers', category: 'big4' },

  // --- Enterprise IT & Global Consultancies ---
  { name: 'IBM', ats: 'direct', slug: 'ibm', careersUrl: 'https://www.ibm.com/careers', category: 'enterprise_it' },
  { name: 'UST', ats: 'smartrecruiters', slug: 'UST', careersUrl: 'https://www.ust.com/en/careers', category: 'enterprise_it' },
  { name: 'IBS Software', ats: 'smartrecruiters', slug: 'IBS_Software', careersUrl: 'https://www.ibsplc.com/careers', category: 'enterprise_it' },
  { name: 'Cognizant', ats: 'smartrecruiters', slug: 'Cognizant', careersUrl: 'https://careers.cognizant.com', category: 'enterprise_it' },
  { name: 'Accenture', ats: 'direct', slug: 'accenture', careersUrl: 'https://www.accenture.com/in-en/careers', category: 'enterprise_it' },
  { name: 'Capgemini', ats: 'smartrecruiters', slug: 'Capgemini', careersUrl: 'https://www.capgemini.com/in-en/careers', category: 'enterprise_it' },
  { name: 'Infosys', ats: 'direct', slug: 'infosys', careersUrl: 'https://www.infosys.com/careers', category: 'enterprise_it' },
  { name: 'TCS', ats: 'direct', slug: 'tcs', careersUrl: 'https://www.tcs.com/careers', category: 'enterprise_it' },
  { name: 'Wipro', ats: 'direct', slug: 'wipro', careersUrl: 'https://careers.wipro.com', category: 'enterprise_it' },

  // --- High-Growth Indian Tech & Unicorns ---
  { name: 'Postman', ats: 'greenhouse', slug: 'postman', category: 'tech_unicorn' },
  { name: 'Razorpay', ats: 'lever', slug: 'razorpay', category: 'tech_unicorn' },
  { name: 'BrowserStack', ats: 'greenhouse', slug: 'browserstack', category: 'tech_unicorn' },
  { name: 'Swiggy', ats: 'lever', slug: 'swiggy', category: 'tech_unicorn' },
  { name: 'CRED', ats: 'lever', slug: 'cred', category: 'tech_unicorn' },
  { name: 'CleverTap', ats: 'greenhouse', slug: 'clevertap', category: 'tech_unicorn' },
  { name: 'Urban Company', ats: 'lever', slug: 'urbancompany', category: 'tech_unicorn' },

  // --- Leading Global Tech & Cloud Platforms ---
  { name: 'Atlassian', ats: 'lever', slug: 'atlassian', category: 'global_enterprise' },
  { name: 'GitLab', ats: 'greenhouse', slug: 'gitlab', category: 'global_enterprise' },
  { name: 'Elastic', ats: 'greenhouse', slug: 'elastic', category: 'global_enterprise' },
  { name: 'Datadog', ats: 'greenhouse', slug: 'datadog', category: 'global_enterprise' },
  { name: 'Cloudflare', ats: 'greenhouse', slug: 'cloudflare', category: 'global_enterprise' },
  { name: 'Stripe', ats: 'greenhouse', slug: 'stripe', category: 'global_enterprise' },
  { name: 'Figma', ats: 'greenhouse', slug: 'figma', category: 'global_enterprise' },
  { name: 'Affirm', ats: 'greenhouse', slug: 'affirm', category: 'global_enterprise' }
];

/**
 * Checks whether a company name matches any known target company.
 */
export function isKnownTargetCompany(companyName: string): boolean {
  if (!companyName) return false;
  const normalized = companyName.toLowerCase();
  return TARGET_COMPANIES.some((tc) =>
    normalized.includes(tc.name.toLowerCase()) || tc.name.toLowerCase().includes(normalized)
  );
}
