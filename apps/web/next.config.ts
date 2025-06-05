import { env } from '@/env';
import { withContentCollections } from '@content-collections/next';
import { withToolbar } from '@delulu/feature-flags/lib/toolbar';
import { config, withAnalyzer } from '@delulu/next-config';
import { withLogging, withSentry } from '@delulu/observability/next-config';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';

let nextConfig: NextConfig = withToolbar(withLogging(config));

nextConfig.images?.remotePatterns?.push(
  {
    protocol: 'https',
    hostname: 'assets.basehub.com',
  },
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
  }
);

if (process.env.NODE_ENV === 'production') {
  const redirects: NextConfig['redirects'] = async () => [
    {
      source: '/legal',
      destination: '/legal/privacy',
      statusCode: 301,
    },
  ];

  nextConfig.redirects = redirects;
}

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

export default withContentCollections(nextConfig);

initOpenNextCloudflareForDev();
