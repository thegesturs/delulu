"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ArrowRight01Icon,
  Comment01Icon,
  MailSend01Icon,
  TickDouble01Icon,
} from "@delulu/icons";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo } from "react";
import { useAutomationWorkspace } from "@/components/automations/automation-resource";
import { useApiClient } from "@/components/providers/api-client";
import { useResourceAtom } from "@/state/resources";

function AutomationSetupContent({ workspaceId }: { workspaceId: string }) {
  const { resources } = useApiClient();
  const scope = useMemo(
    () => ({ workspaceId, platform: "instagram" as const, category: "dm" }),
    [workspaceId]
  );
  const options = useMemo(
    () => resources.automations.list(scope),
    [resources, scope]
  );
  const automationsQuery = useResourceAtom({
    ...options,
    queryKey: options.queryKey!,
  });
  const automations = automationsQuery.data?.data ?? [];
  const hasAutomations = automations.length > 0;
  const activeCount = automations.filter(
    (automation) => automation.enabled
  ).length;

  return (
    <div className="space-y-8">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 text-center"
        initial={{ opacity: 0, y: 10 }}
      >
        <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
          Set Up Your First Auto-DM
        </h2>
        <p className="text-lg text-muted-foreground tracking-tight">
          Turn Instagram comments into DMs automatically — this is what makes
          Delulu different from every scheduler.
        </p>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg space-y-4 rounded-2xl border bg-card p-6"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="text-primary" icon={Comment01Icon} size={22} />
          </div>
          <div className="space-y-1 text-left">
            <p className="font-semibold">Lead Magnet (recommended)</p>
            <p className="text-muted-foreground text-sm">
              Someone comments a keyword → we DM them your link and reply to
              their comment. Same flow as ManyChat, built in.
            </p>
          </div>
        </div>

        <ol className="space-y-2 text-muted-foreground text-sm">
          <li className="flex gap-2">
            <span className="font-medium text-foreground">1.</span>
            Pick a post (or all posts) to watch for comments
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-foreground">2.</span>
            Set a keyword like LINK or GUIDE
          </li>
          <li className="flex gap-2">
            <span className="font-medium text-foreground">3.</span>
            Write the DM with your link — we handle the rest
          </li>
        </ol>

        {hasAutomations ? (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <Icon className="text-primary" icon={TickDouble01Icon} size={18} />
            <span>
              {activeCount > 0
                ? `${activeCount} automation${activeCount === 1 ? "" : "s"} active`
                : `${automations.length} automation${automations.length === 1 ? "" : "s"} saved`}
            </span>
          </div>
        ) : null}

        <Button asChild className="w-full" size="lg">
          <Link href="/automations/new?template=lead-magnet">
            <Icon className="mr-2" icon={MailSend01Icon} size={18} />
            {hasAutomations
              ? "Create another automation"
              : "Create lead magnet automation"}
            <Icon className="ml-2" icon={ArrowRight01Icon} size={16} />
          </Link>
        </Button>

        <p className="text-center text-muted-foreground text-xs">
          Opens the automation builder. Come back here when you&apos;re done, or
          skip and set it up later.
        </p>
      </motion.div>
    </div>
  );
}

export function AutomationSetupStep() {
  const workspace = useAutomationWorkspace();
  if (workspace.isPending) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Loading automations...
      </p>
    );
  }
  if (workspace.isError || !workspace.workspaceId) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Automations are unavailable right now. You can continue onboarding and
        set one up later.
      </p>
    );
  }
  return <AutomationSetupContent workspaceId={workspace.workspaceId} />;
}
