"use client";

import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ArrowLeft01Icon,
  Comment01Icon,
  Loading03Icon,
  MailSend01Icon,
  TickDouble01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "convex-helpers/react/cache";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/header";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AutomationAnalyticsPage() {
  const params = useParams();
  const automationId = params.id as Id<"automations">;

  const automation = useQuery(api.automations.getAutomation, {
    id: automationId,
  });
  const logs = useQuery(api.automationLogs.getLogsByAutomation, {
    automationId,
    limit: 50,
  });

  if (automation === undefined) {
    return (
      <div className="flex h-full gap-4">
        <div className="flex-1">
          <Header page="Loading..." pages={["Automations"]} />
          <div className="flex h-64 items-center justify-center">
            <Icon
              className="animate-spin text-muted-foreground"
              icon={Loading03Icon}
              size={24}
            />
          </div>
        </div>
      </div>
    );
  }

  if (automation === null) {
    return (
      <div className="flex h-full gap-4">
        <div className="flex-1">
          <Header page="Not Found" pages={["Automations"]} />
          <div className="flex h-64 flex-col items-center justify-center">
            <p className="text-muted-foreground">Automation not found</p>
            <Link href="/automations">
              <Button variant="link">Back to Automations</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-background">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/automations">
            <Button size="icon" variant="ghost">
              <Icon icon={ArrowLeft01Icon} size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-2xl">{automation.name}</h1>
            <p className="text-muted-foreground text-sm">
              Automation analytics
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Icon
                  className="text-blue-600 dark:text-blue-400"
                  icon={Comment01Icon}
                  size={20}
                />
              </div>
              <div>
                <p className="font-semibold text-foreground text-xl">
                  {automation.totalTriggered}
                </p>
                <p className="text-muted-foreground text-xs">Total Triggered</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Icon
                  className="text-green-600 dark:text-green-400"
                  icon={MailSend01Icon}
                  size={20}
                />
              </div>
              <div>
                <p className="font-semibold text-foreground text-xl">
                  {automation.totalDMsSent}
                </p>
                <p className="text-muted-foreground text-xs">DMs Sent</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Icon
                  className="text-purple-600 dark:text-purple-400"
                  icon={TickDouble01Icon}
                  size={20}
                />
              </div>
              <div>
                <p className="font-semibold text-foreground text-xl">
                  {automation.totalTriggered > 0
                    ? Math.round(
                        (automation.totalDMsSent / automation.totalTriggered) *
                          100
                      )
                    : 0}
                  %
                </p>
                <p className="text-muted-foreground text-xs">Success Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent DMs Sent</CardTitle>
          </CardHeader>
          <CardContent>
            {logs && logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    className="flex items-start gap-4 rounded-lg border border-border bg-card/50 p-4"
                    key={log._id}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          DM Sent
                        </Badge>
                        {log.instagramUsername && (
                          <span className="font-medium text-foreground text-sm">
                            @{log.instagramUsername}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-muted-foreground text-xs">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 rounded-full bg-muted/50 p-4">
                  <Icon
                    className="text-muted-foreground"
                    icon={Comment01Icon}
                    size={24}
                  />
                </div>
                <p className="text-muted-foreground">No activity yet</p>
                <p className="text-muted-foreground text-sm">
                  Activity will appear here when your automation sends DMs
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
