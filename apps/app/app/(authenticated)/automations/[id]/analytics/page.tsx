'use client';

import { Header } from '@/components/layout/header';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@delulu/design-system/components/ui/card';
import { Icon } from '@delulu/design-system/providers/icon';
import {
  Loading03Icon,
  ArrowLeft01Icon,
  TickDouble01Icon,
  MailSend01Icon,
  Comment01Icon,
} from '@hugeicons-pro/core-solid-rounded';
import { useQuery } from 'convex-helpers/react/cache';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function AutomationAnalyticsPage() {
  const params = useParams();
  const automationId = params.id as Id<'automations'>;

  const automation = useQuery(api.automations.getAutomation, { id: automationId });
  const logs = useQuery(api.automationLogs.getLogsByAutomation, {
    automationId,
    limit: 50,
  });

  if (automation === undefined) {
    return (
      <div className="flex h-full gap-4">
        <div className="flex-1">
          <Header pages={['Automations']} page="Loading..." />
          <div className="flex h-64 items-center justify-center">
            <Icon icon={Loading03Icon} size={24} className="animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (automation === null) {
    return (
      <div className="flex h-full gap-4">
        <div className="flex-1">
          <Header pages={['Automations']} page="Not Found" />
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
            <Button variant="ghost" size="icon">
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
                <Icon icon={Comment01Icon} size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-xl">{automation.totalTriggered}</p>
                <p className="text-muted-foreground text-xs">Total Triggered</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Icon icon={MailSend01Icon} size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-xl">{automation.totalDMsSent}</p>
                <p className="text-muted-foreground text-xs">DMs Sent</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Icon icon={TickDouble01Icon} size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-xl">
                  {automation.totalTriggered > 0
                    ? Math.round((automation.totalDMsSent / automation.totalTriggered) * 100)
                    : 0}%
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
                    key={log._id}
                    className="flex items-start gap-4 rounded-lg border border-border bg-card/50 p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          DM Sent
                        </Badge>
                        {log.instagramUsername && (
                          <span className="text-foreground text-sm font-medium">
                            @{log.instagramUsername}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
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
                  <Icon icon={Comment01Icon} size={24} className="text-muted-foreground" />
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
