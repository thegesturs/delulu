"use client";

import { api } from "@delulu/database/convex/_generated/api";
import { formatDmLimit } from "@delulu/payments";
import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import { MailSend01Icon } from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "convex-helpers/react/cache";
import Link from "next/link";

export function DmSummaryCard() {
  const summary = useQuery(api.automations.getAutomationSummary, {});

  if (!summary || summary.total === 0) {
    return null;
  }

  const { dmsSentThisPeriod, dmLimit, active, totalDMsSent } = summary;
  const isUnlimited = dmLimit === -1;
  const usagePct = isUnlimited
    ? 0
    : dmLimit > 0
      ? Math.min(100, Math.round((dmsSentThisPeriod / dmLimit) * 100))
      : 0;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="text-primary" icon={MailSend01Icon} size={20} />
          </div>
          <div>
            <p className="font-medium text-sm">DM Automations</p>
            <p className="text-muted-foreground text-xs">
              {active} active · {totalDMsSent.toLocaleString()} DMs sent all
              time
            </p>
            {!isUnlimited && (
              <p className="mt-1 text-muted-foreground text-xs">
                {dmsSentThisPeriod.toLocaleString()} /{" "}
                {formatDmLimit(dmLimit)} auto-DMs this period
              </p>
            )}
          </div>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/automations">View automations</Link>
        </Button>
      </div>
      {!isUnlimited && dmLimit > 0 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${usagePct}%` }}
          />
        </div>
      )}
    </div>
  );
}