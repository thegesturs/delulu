import { createMetadata } from "@delulu/seo/metadata";
import type { Metadata } from "next";

import CTA from "@/components/home/cta";
import { FAQ } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { MascotBenefits } from "@/components/home/mascot-benefits";
import { MascotStruggle } from "@/components/home/mascot-struggle";
import Pricing from "@/components/home/pricing";

export const generateMetadata = (): Metadata => {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://delulu.social";

  return createMetadata({
    title: "Delulu Social - Social Media Management Platform",
    description:
      "Manage all your social media platforms in one place. Create, schedule, and publish content across Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and more.",
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title: "Delulu Social - Social Media Management Platform",
      description:
        "Manage all your social media platforms in one place. Create, schedule, and publish content across Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and more.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Delulu Social - Social Media Management Platform",
      description:
        "Manage all your social media platforms in one place. Create, schedule, and publish content across Instagram, Facebook, Twitter, LinkedIn, TikTok, Pinterest, and more.",
    },
  });
};

const Home = () => {
  return (
    <main className="mx-auto max-w-7xl border-x">
      <Hero />
      <MascotStruggle />
      <MascotBenefits />
      {/* <MascotSocialProof /> */}
      <Pricing />
      <FAQ />
      <CTA />
    </main>
  );
};

export default Home;
