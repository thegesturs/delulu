import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import Pricing from "@/components/home/pricing";

export const metadata: Metadata = createMetadata({
  title: "Pricing",
  description:
    "Simple, transparent pricing for social media management. Choose the perfect plan for your needs - from free to unlimited. No hidden fees, cancel anytime.",
  alternates: {
    canonical: getWebUrl("/pricing"),
  },
});

const PricingPage = () => <Pricing />;

export default PricingPage;
