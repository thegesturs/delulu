import type {
  Article,
  Blog,
  BlogPosting,
  FAQPage,
  HowTo,
  Organization,
  SoftwareApplication,
  Thing,
  WebSite,
  WithContext,
} from "schema-dts";

interface JsonLdProps {
  code: WithContext<Thing>;
}

export const JsonLd = ({ code }: JsonLdProps) => (
  <script
    dangerouslySetInnerHTML={{ __html: JSON.stringify(code) }}
    type="application/ld+json"
  />
);

// Organization schema for Delulu Social
export const createOrganizationSchema = (
  url: string
): WithContext<Organization> => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Delulu Social",
  url,
  logo: `${url}/images/logo.png`,
  description:
    "Social media management platform for creating and publishing content across multiple social networks",
  sameAs: [
    "https://twitter.com/delulusocial",
    "https://linkedin.com/company/delulu-social",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    url: `${url}/contact`,
  },
});

// Website schema
export const createWebSiteSchema = (url: string): WithContext<WebSite> => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Delulu Social",
  url,
  description:
    "Manage all your social media platforms in one place. Create, schedule, and publish content across Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and more.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${url}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
    // biome-ignore lint/suspicious/noExplicitAny: JSON-LD schema requires flexible typing
  } as any,
});

// Software Application schema
export const createSoftwareApplicationSchema = (
  url: string
): WithContext<SoftwareApplication> => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Delulu Social",
  description:
    "Social media management platform for creating and publishing content across multiple social networks including Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, Threads, and Farcaster.",
  url,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    priceValidUntil: "2025-12-31",
  },
  featureList: [
    "Multi-platform social media posting",
    "Content creation and editing",
    "Social media scheduling",
    "Analytics and insights",
    "Team collaboration",
    "Content calendar management",
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
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: title,
  description,
  url,
  image: image || `${url}/api/og?title=${encodeURIComponent(title)}`,
  datePublished,
  dateModified: dateModified || datePublished,
  author: {
    "@type": "Person",
    name: authorName || "Delulu Social",
    url: authorUrl || url,
  },
  publisher: {
    "@type": "Organization",
    name: "Delulu Social",
    logo: {
      "@type": "ImageObject",
      url: `${url}/images/logo.png`,
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": url,
  },
  inLanguage: "en-US",
  isAccessibleForFree: true,
});

// Blog schema for blog index pages
export const createBlogSchema = ({
  title,
  description,
  url,
  posts = [],
}: {
  title: string;
  description: string;
  url: string;
  posts?: Array<{
    title: string;
    url: string;
    datePublished: string;
    author?: string;
  }>;
}): WithContext<Blog> => ({
  "@context": "https://schema.org",
  "@type": "Blog",
  name: title,
  description,
  url,
  publisher: {
    "@type": "Organization",
    name: "Delulu Social",
    logo: {
      "@type": "ImageObject",
      // biome-ignore lint/performance/useTopLevelRegex: URL manipulation, regex used once
      url: `${url.replace(/\/blogs.*/, "")}/images/logo.png`,
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": url,
  },
  inLanguage: "en-US",
  isAccessibleForFree: true,
  about: [
    {
      "@type": "Thing",
      name: "Social Media Management",
      description:
        "Tips and strategies for managing multiple social media accounts effectively",
    },
    {
      "@type": "Thing",
      name: "Content Creation",
      description:
        "Creative techniques for producing engaging social media content",
    },
    {
      "@type": "Thing",
      name: "Digital Marketing",
      description: "Modern marketing strategies for social media platforms",
    },
  ],
  ...(posts.length > 0 && {
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: post.url,
      datePublished: post.datePublished,
      author: {
        "@type": "Person",
        name: post.author || "Delulu Social",
      },
    })),
  }),
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
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  url,
  datePublished,
  dateModified: dateModified || datePublished,
  author: {
    "@type": "Organization",
    name: "Delulu Social",
  },
  publisher: {
    "@type": "Organization",
    name: "Delulu Social",
    logo: {
      "@type": "ImageObject",
      url: `${url}/images/logo.png`,
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": url,
  },
  inLanguage: "en-US",
});

// FAQ Page schema for AI chatbots (they love Q&A format)
export const createFAQPageSchema = ({
  title,
  url,
  questions,
}: {
  title: string;
  url: string;
  questions: Array<{ question: string; answer: string }>;
}): WithContext<FAQPage> => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  name: title,
  url,
  mainEntity: questions.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
});

// How-To schema for step-by-step content (AI loves structured instructions)
export const createHowToSchema = ({
  title,
  description,
  url,
  image,
  steps,
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  steps: Array<{ name: string; text: string; image?: string }>;
}): WithContext<HowTo> => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: title,
  description,
  url,
  image: image || `${url}/api/og?title=${encodeURIComponent(title)}`,
  step: steps.map((step, index) => ({
    "@type": "HowToStep",
    position: index + 1,
    name: step.name,
    text: step.text,
    image: step.image,
  })),
});

// Enhanced Software Application schema with AI-friendly features
export const createAISoftwareApplicationSchema = (
  url: string
): WithContext<SoftwareApplication> => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Delulu Social",
  description:
    "AI-powered social media management platform for creating and publishing content across multiple social networks including Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, Threads, and Farcaster.",
  url,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    priceValidUntil: "2025-12-31",
  },
  featureList: [
    "Multi-platform social media posting to 8+ networks",
    "AI-powered content creation and optimization",
    "Social media scheduling and automation",
    "Advanced analytics and performance insights",
    "Team collaboration and workflow management",
    "Content calendar and planning tools",
    "Real-time collaboration features",
    "Cross-platform content synchronization",
  ],
  screenshot: `${url}/images/app-light.png`,
  // AI-friendly conversational features
  about: [
    {
      "@type": "Thing",
      name: "social media management",
      description:
        "Comprehensive platform for managing multiple social media accounts",
    },
    {
      "@type": "Thing",
      name: "content creation",
      description: "Tools for creating engaging social media content",
    },
    {
      "@type": "Thing",
      name: "multi-platform posting",
      description:
        "Publish content simultaneously across all major social networks",
    },
  ],
  // Common questions AI might ask
  potentialAction: [
    {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    {
      "@type": "ViewAction",
      target: `${url}/pricing`,
      name: "View Pricing Plans",
    },
    {
      "@type": "RegisterAction",
      target: `${url}/sign-up`,
      name: "Sign Up for Free",
    },
    // biome-ignore lint/suspicious/noExplicitAny: JSON-LD schema requires flexible typing
  ] as any,
});

export * from "schema-dts";
