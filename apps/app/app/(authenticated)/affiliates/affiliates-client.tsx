"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import Link from "next/link";

const PORTAL_URL = process.env.NEXT_PUBLIC_AFFONSO_PORTAL_URL || "#";

const steps = [
  {
    step: "1",
    title: "Join the Program",
    description:
      "Sign up for free in the affiliate portal. It takes less than 2 minutes.",
  },
  {
    step: "2",
    title: "Get Your Link",
    description:
      "Grab your unique referral link from the affiliate dashboard.",
  },
  {
    step: "3",
    title: "Share & Earn",
    description:
      "Share your link anywhere. Earn a commission on every subscription from your referrals.",
  },
];

const benefits = [
  {
    title: "Recurring Commissions",
    description:
      "Earn on every renewal, not just the first payment. As long as your referral stays subscribed, you keep earning.",
  },
  {
    title: "90-Day Cookie Window",
    description:
      "Your referral link stays active for 90 days. Even if they don't subscribe right away, you still get credit.",
  },
  {
    title: "Real-Time Tracking",
    description:
      "See clicks, signups, conversions, and earnings in real time from your affiliate dashboard.",
  },
  {
    title: "Easy Payouts",
    description:
      "Get paid via PayPal, Wise, or Crypto. Payouts are processed automatically every month.",
  },
];

const faqs = [
  {
    q: "How much can I earn?",
    a: "There's no cap on earnings. You earn a percentage of every subscription payment made by your referrals, for as long as they stay subscribed.",
  },
  {
    q: "When do I get paid?",
    a: "Payouts are processed monthly via your chosen method (PayPal, Wise, or Crypto) through the affiliate portal.",
  },
  {
    q: "How do I track my referrals?",
    a: "Your affiliate dashboard shows real-time stats on clicks, leads, conversions, and earnings.",
  },
  {
    q: "Who can become an affiliate?",
    a: "Anyone! Whether you're a content creator, blogger, social media manager, or just love Delulu Social — you can earn by sharing.",
  },
];

export default function AffiliatesClient() {
  return (
    <div className="container mx-auto h-full max-w-5xl space-y-10 overflow-y-auto px-2 py-8">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Affiliate Program
        </h1>
        <p className="mt-2 text-muted-foreground">
          Earn recurring commissions by referring others to Delulu Social
        </p>
      </div>

      {/* CTA Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl">
            Start Earning with Delulu Social
          </CardTitle>
          <CardDescription className="text-base">
            Share your unique link, and earn a commission every time someone you
            refer subscribes. No cap, no catch.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href={PORTAL_URL} rel="noopener noreferrer" target="_blank">
              Open Affiliate Portal
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={PORTAL_URL} rel="noopener noreferrer" target="_blank">
              Sign Up as Affiliate
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* How It Works */}
      <div>
        <h2 className="mb-6 font-bold text-2xl">How It Works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.step}>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  {s.step}
                </div>
                <CardTitle className="text-lg">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div>
        <h2 className="mb-6 font-bold text-2xl">Why Join?</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {benefits.map((b) => (
            <Card key={b.title}>
              <CardHeader>
                <CardTitle className="text-base">{b.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{b.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="mb-6 font-bold text-2xl">Frequently Asked Questions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((f) => (
            <Card key={f.q}>
              <CardHeader>
                <CardTitle className="text-base">{f.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{f.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <Card className="text-center">
        <CardContent className="py-10">
          <h3 className="mb-2 font-bold text-xl">Ready to Start Earning?</h3>
          <p className="mb-6 text-muted-foreground">
            Join the affiliate program and get your referral link today.
          </p>
          <Button asChild size="lg">
            <Link href={PORTAL_URL} rel="noopener noreferrer" target="_blank">
              Join the Affiliate Program
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
