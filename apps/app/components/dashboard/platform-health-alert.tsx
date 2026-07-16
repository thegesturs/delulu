"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Card } from "@delulu/design-system/components/ui/card";
import { Icon } from "@delulu/design-system/providers/icon";
import { Alert01Icon } from "@hugeicons-pro/core-solid-rounded";
import Link from "next/link";
import { useApiClient } from "@/components/providers/api-client";
import { useOperationsWorkspace } from "@/hooks/use-operations-workspace";
import { useResourceAtom } from "@/state/resources";

export function PlatformHealthAlert() {
  const { resources } = useApiClient();
  const workspace = useOperationsWorkspace();
  const workspaceId = workspace.workspaceId ?? "";
  const options = resources.connections.list(workspaceId, { limit: 100 });
  const query = useResourceAtom({
    ...options,
    queryKey: options.queryKey!,
    enabled: !!workspace.workspaceId,
    staleTime: 60_000,
  });

  const now = Date.now();
  const expired = (query.data?.data ?? []).filter(
    (account) =>
      account.expiresAt && new Date(account.expiresAt).getTime() <= now
  ).length;

  if (expired === 0) {
    return null;
  }

  return (
    <Card className="gap-0 border-amber-200/70 bg-amber-50/40 p-0 dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <Icon
          className="text-amber-600 dark:text-amber-400"
          icon={Alert01Icon}
          size={16}
        />
        <p className="font-medium text-amber-800 text-sm dark:text-amber-200">
          {expired} account{expired === 1 ? "" : "s"} need
          {expired === 1 ? "s" : ""} reconnecting
        </p>
        <Button
          asChild
          className="ml-auto h-7 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
          size="sm"
          variant="ghost"
        >
          <Link href="/socials">Reconnect</Link>
        </Button>
      </div>
    </Card>
  );
}
