import type { JobProfile, RawJobListing } from '../types.ts';

export function getProfiles(env: Record<string, string | undefined> = process.env): JobProfile[] {
  const defaultRecipient = env.RECIPIENT_EMAIL || 'user@example.com';

  return [
    {
      id: 'power-platform',
      name: 'Power Platform Job Radar',
      recipientEmail: env.RECIPIENT_EMAIL_POWERPLATFORM || defaultRecipient,
      queryTerms: ['power apps', 'power platform', 'dynamics'],
      keywords: [
        'power apps',
        'powerapps',
        'power platform',
        'powerplatform',
        'power automate',
        'powerautomate',
        'dataverse',
        'pcf',
        'power pages',
        'powerpages',
        'power virtual agents',
        'copilot studio',
        'dynamics 365'
      ],
      skills: [
        {
          tag: '[Canvas Apps]',
          patterns: ['canvas app', 'canvas apps', /\bcanvas\b/i]
        },
        {
          tag: '[Model-Driven]',
          patterns: ['model driven', 'model-driven', 'modeldriven']
        },
        {
          tag: '[Dataverse]',
          patterns: ['dataverse', 'common data service', /\bcds\b/i]
        },
        {
          tag: '[PCF]',
          patterns: ['pcf', 'power apps component framework', 'powerapps component framework']
        },
        {
          tag: '[Power Automate]',
          patterns: ['power automate', 'powerautomate', 'cloud flow', 'ms flow', 'flow designer']
        },
        {
          tag: '[Copilot Studio]',
          patterns: ['copilot studio', 'power virtual agents', /\bpva\b/i, 'copilot']
        },
        {
          tag: '[Power Pages]',
          patterns: ['power pages', 'powerpages', 'power portals', 'power apps portal']
        },
        {
          tag: '[Dynamics 365]',
          patterns: ['dynamics 365', /\bd365\b/i, 'dynamics crm']
        }
      ],
      defaultTag: '[Power Platform]',
      accentColor: '#742774'
    },
    {
      id: 'full-stack',
      name: 'Full Stack Developer Job Radar',
      recipientEmail: env.RECIPIENT_EMAIL_FULLSTACK || defaultRecipient,
      queryTerms: ['full stack', 'angular', 'nestjs', 'dotnet', '.net developer'],
      keywords: [
        'full stack',
        'fullstack',
        'software engineer',
        'backend developer',
        'frontend developer',
        'web developer',
        'angular',
        'nestjs',
        'nest.js',
        '.net',
        'dotnet',
        'postgres',
        'postgresql',
        'mssql',
        'azure devops',
        'github'
      ],
      skills: [
        {
          tag: '[NestJS]',
          patterns: ['nestjs', 'nest.js', /\bnest\s*js\b/i]
        },
        {
          tag: '[Angular]',
          patterns: ['angular', /\bangular\s*[0-9]+\b/i, /\bangularjs\b/i]
        },
        {
          tag: '[.NET]',
          patterns: [
            /(?:^|[^a-zA-Z0-9])\.net(?:$|[^a-zA-Z0-9])/i,
            /\bdotnet\b/i,
            /\bc#\b/i,
            /\basp\.net\b/i,
            /\b\.net\s*core\b/i,
            /\bnet\s*[6-9]\b/i
          ]
        },
        {
          tag: '[PostgreSQL]',
          patterns: ['postgresql', 'postgres', /\bpsql\b/i]
        },
        {
          tag: '[MSSQL]',
          patterns: ['mssql', 'sql server', 'ms sql', 'microsoft sql server', 'microsoft sql']
        },
        {
          tag: '[Azure DevOps]',
          patterns: ['azure devops', 'ado pipelines', 'azure pipeline', 'azure repos']
        },
        {
          tag: '[GitHub]',
          patterns: ['github', 'github actions', 'gh actions']
        }
      ],
      defaultTag: '[Full Stack]',
      accentColor: '#0284c7'
    },
    {
      id: 'java-backend',
      name: 'Java & Spring Boot Developer Job Radar',
      recipientEmail: env.RECIPIENT_EMAIL_JAVA || defaultRecipient,
      queryTerms: ['java developer', 'spring boot', 'java backend', 'java engineer'],
      keywords: [
        'java',
        'spring',
        'spring boot',
        'springboot',
        'hibernate',
        'microservice',
        'microservices',
        'jpa',
        'rest api',
        'oracle sql',
        'postgresql',
        'docker'
      ],
      skills: [
        {
          tag: '[Spring Boot]',
          patterns: ['spring boot', 'springboot', /\bspring-boot\b/i]
        },
        {
          tag: '[Java]',
          patterns: [/(?:^|[^a-zA-Z0-9])java(?:$|[^a-zA-Z0-9])/i, /\bcore java\b/i]
        },
        {
          tag: '[Hibernate/JPA]',
          patterns: ['hibernate', /\bjpa\b/i, 'spring data jpa']
        },
        {
          tag: '[Microservices]',
          patterns: ['microservice', 'microservices', 'distributed systems']
        },
        {
          tag: '[REST APIs]',
          patterns: ['rest api', 'restful', 'rest apis', 'web services']
        },
        {
          tag: '[Oracle SQL]',
          patterns: ['oracle', 'oracle sql', 'pl/sql', 'plsql']
        },
        {
          tag: '[PostgreSQL]',
          patterns: ['postgresql', 'postgres', /\bpsql\b/i]
        },
        {
          tag: '[Docker]',
          patterns: ['docker', 'containerization', 'containers']
        },
        {
          tag: '[Spring Security]',
          patterns: ['spring security', 'jwt', 'oauth2']
        },
        {
          tag: '[React]',
          patterns: [/(?:^|[^a-zA-Z0-9])react(?:$|[^a-zA-Z0-9])/i, /\breactjs\b/i]
        }
      ],
      defaultTag: '[Java Developer]',
      accentColor: '#ea580c'
    }
  ];
}

export function isJobMatchingProfile(job: RawJobListing, profile: JobProfile): boolean {
  const combined = `${job.title} ${job.description || ''}`.toLowerCase();

  // For Full Stack, ensure role matches developer keywords AND at least one of target tech stack
  if (profile.id === 'full-stack') {
    const isTechRole =
      combined.includes('developer') ||
      combined.includes('engineer') ||
      combined.includes('architect') ||
      combined.includes('programmer') ||
      combined.includes('full stack') ||
      combined.includes('fullstack');

    if (!isTechRole) return false;

    const targetStack = [
      'angular',
      'nestjs',
      'nest.js',
      '.net',
      'dotnet',
      'c#',
      'postgres',
      'postgresql',
      'mssql',
      'azure devops',
      'github'
    ];
    return targetStack.some((tech) => combined.includes(tech));
  }

  // For Java Backend, ensure developer role AND matches Java / Spring Boot / Hibernate
  if (profile.id === 'java-backend') {
    const isTechRole =
      combined.includes('developer') ||
      combined.includes('engineer') ||
      combined.includes('architect') ||
      combined.includes('programmer') ||
      combined.includes('backend') ||
      combined.includes('software');

    if (!isTechRole) return false;

    const hasJavaCore =
      /(?:^|[^a-zA-Z0-9])java(?:$|[^a-zA-Z0-9])/i.test(combined) ||
      combined.includes('spring') ||
      combined.includes('spring boot') ||
      combined.includes('springboot') ||
      combined.includes('hibernate');

    return hasJavaCore;
  }

  // Standard matching for other profiles
  return profile.keywords.some((kw) => {
    if (typeof kw === 'string') {
      return combined.includes(kw.toLowerCase());
    }
    return kw.test(combined);
  });
}

export function extractProfileSkillTags(
  title: string,
  description: string = '',
  profile: JobProfile
): string[] {
  const combined = `${title} ${description}`;
  const foundTags: string[] = [];

  for (const rule of profile.skills) {
    const matches = rule.patterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return combined.toLowerCase().includes(pattern.toLowerCase());
      }
      return pattern.test(combined);
    });

    if (matches && !foundTags.includes(rule.tag)) {
      foundTags.push(rule.tag);
    }
  }

  if (foundTags.length === 0) {
    foundTags.push(profile.defaultTag);
  }

  return foundTags;
}
