import { createMetadata } from "@delulu/seo/metadata";
import { getWebUrl } from "@delulu/seo/url";
import type { Metadata } from "next";
import Lifetime from "@/components/home/lifetime";

export const metadata: Metadata = createMetadata({
  title: "Lifetime Deal",
  description:
    "The Delulu Social lifetime deal has ended. View Echo and Vibe subscription plans with Instagram auto-DM automations.",
  alternates: {
    canonical: getWebUrl("/lifetime"),
  },
});

const LifetimePage = () => <Lifetime />;

export default LifetimePage;
