import type { 
  Thing, 
  WithContext, 
  Organization, 
  WebSite, 
  SoftwareApplication,
  BlogPosting,
  Article,
} from 'schema-dts';

type JsonLdProps = {
  code: WithContext<Thing>;
};

export const JsonLd = ({ code }: JsonLdProps) => (
  <script
    type="application/ld+json"
    // biome-ignore lint/security/noDangerouslySetInnerHtml: "This is a JSON-LD script, not user-generated content."
    dangerouslySetInnerHTML={{ __html: JSON.stringify(code) }}
  />
);

// Organization schema for Delulu Social
export const createOrganizationSchema = (url: string): WithContext<Organization> => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Delulu Social',
  url,
  logo: `${url}/images/logo.png`,
  description: 'Social media management platform for creating and publishing content across multiple social networks',
  sameAs: [
    'https://twitter.com/delulusocial',
    'https://linkedin.com/company/delulu-social',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    url: `${url}/contact`,
  },
});

// Website schema
export const createWebSiteSchema = (url: string): WithContext<WebSite> => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Delulu Social',
  url,
  description: 'Manage all your social media platforms in one place. Create, schedule, and publish content across Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and more.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${url}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } as any,
});

// Software Application schema
export const createSoftwareApplicationSchema = (url: string): WithContext<SoftwareApplication> => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Delulu Social',
  description: 'Social media management platform for creating and publishing content across multiple social networks including Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, Threads, and Farcaster.',
  url,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    priceValidUntil: '2025-12-31',
  },
  featureList: [
    'Multi-platform social media posting',
    'Content creation and editing',
    'Social media scheduling',
    'Analytics and insights',
    'Team collaboration',
    'Content calendar management',
  ],
  screenshot: `${url}/images/app-light.png`,
});

// Blog posting schema
export const createBlogPostingSchema = ({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
}): WithContext<BlogPosting> => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  description,
  url,
  image: image || `${url}/api/og?title=${encodeURIComponent(title)}`,
  datePublished,
  dateModified: dateModified || datePublished,
  author: {
    '@type': 'Person',
    name: authorName || 'Delulu Social',
    url: authorUrl || url,
  },
  publisher: {
    '@type': 'Organization',
    name: 'Delulu Social',
    logo: {
      '@type': 'ImageObject',
      url: `${url}/images/logo.png`,
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': url,
  },
  inLanguage: 'en-US',
  isAccessibleForFree: true,
});

// Article schema for legal pages
export const createArticleSchema = ({
  title,
  description,
  url,
  datePublished,
  dateModified,
}: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
}): WithContext<Article> => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  url,
  datePublished,
  dateModified: dateModified || datePublished,
  author: {
    '@type': 'Organization',
    name: 'Delulu Social',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Delulu Social',
    logo: {
      '@type': 'ImageObject',
      url: `${url}/images/logo.png`,
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': url,
  },
  inLanguage: 'en-US',
});

export * from 'schema-dts';
