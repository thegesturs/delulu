import { createMetadata } from "@delulu/seo/metadata";
import { getWebOrigin } from "@delulu/seo/url";
import type { Metadata } from "next";
import { Suspense } from "react";

// ISR: the home page contains a blog preview; revalidate hourly.
export const revalidate = 3600;

import { AgentSections } from "@/components/home/agent-sections";
import { BlogSection } from "@/components/home/blog-section";
import CTA from "@/components/home/cta";
import { FAQ } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import Pricing from "@/components/home/pricing";

export const generateMetadata = (): Metadata => {
  return createMetadata({
    title: "Delulu — Open-Source Social Scheduling for AI Agents",
    description:
      "Give your agent permissioned tools to prepare media, schedule, publish, and handle approvals across 10+ social networks. Hosted or self-hosted.",
    alternates: {
      canonical: getWebOrigin(),
    },
    openGraph: {
      title: "Your agent can run your social media",
      description:
        "Open-source social scheduling infrastructure for agents. Use MCP, the CLI, or the API across 10+ social networks.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Your agent can run your social media",
      description:
        "Open-source social scheduling infrastructure for agents. Hosted or self-hosted.",
    },
  });
};

const Home = () => {
  return (
    <main>
      <Hero />
      <AgentSections />
      <Pricing />
      <FAQ />
      <Suspense>
        <BlogSection />
      </Suspense>
      <CTA />
    </main>
  );
};

export default Home;
