import withBundleAnalyzer from "@next/bundle-analyzer";

import type { NextConfig } from "next";

const otelRegex = /@opentelemetry\/instrumentation/;

export const config: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
  allowedDevOrigins: [
    "http://localhost:3000",
    "https://app.host.local",
    "https://solulu.delulu.social",
  ],

  // biome-ignore lint/suspicious/useAwait: rewrites is async
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },

  webpack(config, { isServer }) {
    if (isServer) {
      config.plugins = config.plugins || [];
    }

    config.ignoreWarnings = [{ module: otelRegex }];

    return config;
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export const withAnalyzer = (sourceConfig: NextConfig): NextConfig =>
  withBundleAnalyzer()(sourceConfig);
