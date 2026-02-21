import { createMetadata } from "@delulu/seo/metadata";
import type { Metadata } from "next";
import Pricing from "@/components/home/pricing";

export const metadata: Metadata = createMetadata({
  title: "Pricing",
  description:
    "Simple, transparent pricing for social media management. Choose the perfect plan for your needs - from free to unlimited. No hidden fees, cancel anytime.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_WEB_URL || "https://delulu.social"}/pricing`,
  },
});

const PricingPage = () => <Pricing />;

export default PricingPage;
