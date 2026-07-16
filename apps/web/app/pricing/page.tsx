import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import Pricing from "@/components/home/pricing";

export const metadata: Metadata = createMetadata({
  title: "Pricing",
  description:
    "Hosted plans for agent-driven social scheduling, plus a free Community self-hosted option under AGPL-3.0.",
  alternates: {
    canonical: getWebUrl("/pricing"),
  },
});

const PricingPage = () => <Pricing />;

export default PricingPage;
