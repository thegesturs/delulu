import { Button } from "@delulu/design-system/components/ui/button";
import { createMetadata } from "@delulu/seo/metadata";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = createMetadata({
  title: "Affiliate Program",
  description:
    "Earn recurring commissions by referring customers to Delulu Social. Join our affiliate program and start earning today.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_WEB_URL || "https://delulu.social"}/affiliates`,
  },
});

const PORTAL_URL = process.env.NEXT_PUBLIC_AFFONSO_PORTAL_URL || "#";

export default function AffiliatesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-24">
      {/* Hero */}
      <div className="mb-20 text-center">
        <h1 className="mb-4 font-bold text-4xl tracking-tight sm:text-5xl">
          Earn Money Sharing <span className="text-primary">Delulu Social</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Join our affiliate program and earn recurring commissions every time
          someone you refer subscribes. No cap on earnings.
        </p>
        <Button asChild className="h-14 px-8 text-lg" size="lg">
          <Link href={PORTAL_URL}>Join the Affiliate Program</Link>
        </Button>
      </div>

      {/* How it works */}
      <div className="mb-20">
        <h2 className="mb-10 text-center font-bold text-3xl">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-lg text-primary">
              1
            </div>
            <h3 className="mb-2 font-semibold text-lg">Sign Up</h3>
            <p className="text-muted-foreground text-sm">
              Create your free affiliate account and get your unique referral
              link in minutes.
            </p>
          </div>
          <div className="rounded-xl border p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-lg text-primary">
              2
            </div>
            <h3 className="mb-2 font-semibold text-lg">Share</h3>
            <p className="text-muted-foreground text-sm">
              Share your link with your audience — on social media, your blog,
              newsletter, or anywhere you like.
            </p>
          </div>
          <div className="rounded-xl border p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-lg text-primary">
              3
            </div>
            <h3 className="mb-2 font-semibold text-lg">Earn</h3>
            <p className="text-muted-foreground text-sm">
              Earn a commission every time someone subscribes through your link.
              Recurring commissions on every renewal.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-20">
        <h2 className="mb-10 text-center font-bold text-3xl">
          Why Join Our Program?
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex gap-4 rounded-xl border p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">Recurring Commissions</h3>
              <p className="text-muted-foreground text-sm">
                Earn on every payment your referrals make — not just the first
                one. As long as they stay subscribed, you keep earning.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-xl border p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M9 19V6l12-3v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="15" r="3" />
              </svg>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">90-Day Cookie</h3>
              <p className="text-muted-foreground text-sm">
                Your referral link stays active for 90 days. Even if someone
                doesn&apos;t subscribe right away, you still get credit.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-xl border p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">Real-Time Dashboard</h3>
              <p className="text-muted-foreground text-sm">
                Track clicks, signups, conversions, and earnings in real-time
                from your dedicated affiliate dashboard.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-xl border p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div>
              <h3 className="mb-1 font-semibold">Easy Payouts</h3>
              <p className="text-muted-foreground text-sm">
                Get paid via PayPal, Wise, or Crypto. Payouts are processed
                automatically — no chasing invoices.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border bg-primary/5 p-12 text-center">
        <h2 className="mb-4 font-bold text-3xl">Ready to Start Earning?</h2>
        <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
          Sign up takes less than 2 minutes. Get your referral link and start
          sharing today.
        </p>
        <Button asChild className="h-14 px-8 text-lg" size="lg">
          <Link href={PORTAL_URL}>Become an Affiliate</Link>
        </Button>
        <p className="mt-4 text-muted-foreground text-sm">
          Questions? Email us at{" "}
          <Link
            className="text-primary underline"
            href="mailto:support@delulu.social"
          >
            support@delulu.social
          </Link>
        </p>
      </div>
    </div>
  );
}
