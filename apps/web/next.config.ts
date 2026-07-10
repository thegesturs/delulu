import { withContentCollections } from "@content-collections/next";
import { config, withAnalyzer } from "@delulu/next-config";
import { withLogging } from "@delulu/observability/next-config";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";
import { env } from "@/env";

let nextConfig: NextConfig = withLogging(config);

// youtubei.js is large and relies on Node built-ins; keep it out of the bundle
// so it loads as an external at runtime (needed for the YouTube trimmer API route).
nextConfig.serverExternalPackages = [
  ...(nextConfig.serverExternalPackages ?? []),
  "youtubei.js",
];

nextConfig.images?.remotePatterns?.push(
  {
    protocol: "https",
    hostname: "assets.basehub.com",
  },
  {
    protocol: "https",
    hostname: "images.unsplash.com",
  },
  {
    protocol: "https",
    hostname: "assets.aceternity.com",
  }
);

if (process.env.NODE_ENV === "production") {
  const redirects: NextConfig["redirects"] = async () => [
    {
      source: "/legal",
      destination: "/legal/privacy",
      statusCode: 301,
    },
  ];

  nextConfig.redirects = redirects;
}

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default withContentCollections(nextConfig);

initOpenNextCloudflareForDev();
