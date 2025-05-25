import { withToolbar } from '@delulu/feature-flags/lib/toolbar';
import { config, withAnalyzer } from '@delulu/next-config';
import { withLogging, withSentry } from '@delulu/observability/next-config';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { env } from 'env';
import type { NextConfig } from 'next';

let nextConfig: NextConfig = withToolbar(withLogging(config));

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;

initOpenNextCloudflareForDev();
