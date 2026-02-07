import { config, withAnalyzer } from "@delulu/next-config";
import { withLogging } from "@delulu/observability/next-config";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

let nextConfig: NextConfig = withLogging(config);

if (process.env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;

initOpenNextCloudflareForDev();
