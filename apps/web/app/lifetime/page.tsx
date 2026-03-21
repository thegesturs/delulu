import { createMetadata } from "@delulu/seo/metadata";
import type { Metadata } from "next";
import Lifetime from "@/components/home/lifetime";

export const metadata: Metadata = createMetadata({
  title: "Lifetime Deal - Pay Once, Use Forever",
  description:
    "Get lifetime access to Delulu Social's VIBE plan. Pay once, never pay again. Unlimited social accounts, unlimited posts, team seats, and 1,000 free transcriptions included.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_WEB_URL || "https://delulu.social"}/lifetime`,
  },
});

const LifetimePage = () => <Lifetime />;

export default LifetimePage;
