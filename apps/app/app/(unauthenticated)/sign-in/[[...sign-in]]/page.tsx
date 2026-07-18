import { SignIn } from "@delulu/auth";
import type { Metadata } from "next";

const signInUrl = "https://solulu.delulu.social/sign-in";

export const metadata: Metadata = {
  title: "Sign in | Delulu Social",
  description: "Sign in to manage and publish your social media content.",
  alternates: { canonical: signInUrl },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  return <SignIn />;
}
