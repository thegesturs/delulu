import merge from 'lodash.merge';
import type { Metadata } from 'next';

type MetadataGenerator = Omit<Metadata, 'description' | 'title'> & {
  title: string;
  description: string;
  image?: string;
};

const applicationName = 'Delulu Social';
const author: Metadata['authors'] = {
  name: 'Delulu Social',
  url: 'https://delulu.social/',
};
const publisher = 'Delulu Social';
const twitterHandle = '@delulusocial';
// const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
const productionUrl = process.env.NEXT_PUBLIC_WEB_URL;

export const createMetadata = ({
  title,
  description,
  image,
  ...properties
}: MetadataGenerator): Metadata => {
  const parsedTitle = `${title} | ${applicationName}`;
  const defaultMetadata: Metadata = {
    title: parsedTitle,
    description,
    applicationName,
    keywords: [
      // Core functionality (AI search terms)
      'social media management platform',
      'how to manage multiple social media accounts',
      'best social media scheduling tool',
      'multi-platform posting software',
      'social media content creation tools',
      'social media automation platform',

      // Platform-specific (conversational queries)
      'post to Instagram and Facebook simultaneously',
      'schedule TikTok and Twitter posts',
      'LinkedIn content management',
      'Pinterest marketing automation',
      'Threads publishing tool',
      'Farcaster social media manager',

      // Problem-solving keywords (AI loves these)
      'how to save time on social media',
      'social media management for businesses',
      'content calendar and planning',
      'social media analytics and insights',
      'team collaboration for social media',
      'cross-platform content synchronization',

      // Technical/brand terms
      'Delulu Social',
      'social media dashboard',
      'social media marketing tool',
      'social media scheduler',
      'social media automation',
    ],
    metadataBase: productionUrl
      ? new URL(`${productionUrl}`)
      : new URL('https://delulu.social'),
    authors: [author],
    creator: author.name,
    publisher,
    category: 'Social Media Management',
    classification: 'Social Media Management Platform',
    formatDetection: {
      telephone: false,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: parsedTitle,
    },
    openGraph: {
      title: parsedTitle,
      description,
      type: 'website',
      siteName: applicationName,
      locale: 'en_US',
      countryName: 'United States',
    },
    twitter: {
      card: 'summary_large_image',
      creator: twitterHandle,
      site: twitterHandle,
      title: parsedTitle,
      description,
    },
    alternates: {
      canonical: productionUrl ? `${productionUrl}` : undefined,
    },
  };

  const metadata: Metadata = merge(defaultMetadata, properties);

  if (image && metadata.openGraph && metadata.twitter) {
    const imageObject = {
      url: image,
      width: 1200,
      height: 630,
      alt: title,
      type: 'image/png',
    };

    metadata.openGraph.images = [imageObject];
    metadata.twitter.images = [imageObject];
  }

  return metadata;
};
