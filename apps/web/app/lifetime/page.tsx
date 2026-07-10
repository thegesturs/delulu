import { createMetadata } from "@delulu/seo/metadata";
import type { Metadata } from "next";
import Lifetime from "@/components/home/lifetime";

export const metadata: Metadata = createMetadata({
  title: "Lifetime Deal",
  description:
    "The Delulu Social lifetime deal has ended. View Echo and Vibe subscription plans with Instagram auto-DM automations.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_WEB_URL || "https://delulu.social"}/lifetime`,
  },
});

const LifetimePage = () => <Lifetime />;

export default LifetimePage;
