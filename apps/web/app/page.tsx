import { createMetadata } from "@delulu/seo/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";

// ISR: home page contains a Convex-backed blog preview; revalidate hourly so
// every landing-page visit doesn't hit Convex.
export const revalidate = 3600;

import { BlogSection } from "@/components/home/blog-section";
import CTA from "@/components/home/cta";
import { FAQ } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { MascotBenefits } from "@/components/home/mascot-benefits";
import { MascotStruggle } from "@/components/home/mascot-struggle";
import Pricing from "@/components/home/pricing";

export const generateMetadata = (): Metadata => {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://delulu.social";

  return createMetadata({
    title: "Delulu Social \u2014 Post Everywhere + Auto-DM from $4.99/mo",
    description:
      "Schedule across 8 platforms and auto-DM Instagram commenters. Built for creators who grow. Plans from $4.99/mo with a 14-day guarantee.",
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title: "Delulu Social \u2014 Post Everywhere + Auto-DM for $9.99/mo",
      description:
        "The only tool that schedules your posts across 8 platforms AND turns Instagram comments into engaged followers. Built for creators who grow. $9.99/mo.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Delulu Social \u2014 Post Everywhere + Auto-DM for $9.99/mo",
      description:
        "The only tool that schedules your posts across 8 platforms AND turns Instagram comments into engaged followers. Built for creators who grow. $9.99/mo.",
    },
  });
};

const Home = () => {
  return (
    <main className="mx-auto max-w-7xl border-x">
      <Hero />
      <HowItWorks />
      <MascotStruggle />
      <MascotBenefits />
      {/* <MascotSocialProof /> */}
      <Pricing />
      <Suspense>
        <BlogSection />
      </Suspense>
      <FAQ />
      <CTA />
    </main>
  );
};

export default Home;
