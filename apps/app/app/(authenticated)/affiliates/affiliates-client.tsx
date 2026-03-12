"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import Link from "next/link";
import { api } from "@/trpc/react";

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
    description: "Grab your unique referral link from the affiliate dashboard.",
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

function EmbeddedDashboard() {
  const { data } = api.affiliate.getEmbedToken.useQuery(undefined, {
    retry: false,
  });

  if (!data?.token) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <iframe
        allow="clipboard-write"
        className="h-[600px] w-full border-0"
        src={`https://affonso.io/embed/referrals?token=${data.token}&theme=system`}
        title="Affiliate Dashboard"
      />
    </div>
  );
}

export default function AffiliatesClient() {
  return (
    <div className="mx-auto h-full max-w-5xl space-y-8 overflow-y-auto px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Refer & Earn</h1>
        <p className="mt-1 text-muted-foreground">
          Earn recurring commissions by referring others to Delulu Social
        </p>
      </div>

      {/* Embedded Affiliate Dashboard */}
      <EmbeddedDashboard />

      {/* CTA */}
      <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex-1">
          <p className="font-medium">
            Share your unique link and earn a commission on every referral.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={PORTAL_URL} rel="noopener noreferrer" target="_blank">
            Open Portal
          </Link>
        </Button>
      </div>

      {/* How It Works */}
      <div>
        <h2 className="mb-4 font-semibold text-xl">How It Works</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((s) => (
            <div className="rounded-lg border p-4" key={s.step}>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-sm">
                {s.step}
              </div>
              <h3 className="mb-1 font-medium text-sm">{s.title}</h3>
              <p className="text-muted-foreground text-xs">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Join */}
      <div>
        <h2 className="mb-4 font-semibold text-xl">Why Join?</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {benefits.map((b) => (
            <div className="rounded-lg border p-4" key={b.title}>
              <h3 className="mb-1 font-medium text-sm">{b.title}</h3>
              <p className="text-muted-foreground text-xs">{b.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="mb-4 font-semibold text-xl">FAQ</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {faqs.map((f) => (
            <Card className="shadow-none" key={f.q}>
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-sm">{f.q}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-muted-foreground text-xs">{f.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
