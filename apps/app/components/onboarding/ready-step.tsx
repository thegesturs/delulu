"use client";

import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";
import type { ConnectionView } from "@/types/workspace-views";
import type { OnboardingGoal } from "./goal-step";

export function ReadyStep({
  goal,
  account,
}: {
  goal: OnboardingGoal;
  account: ConnectionView;
}) {
  const name = account.displayName ?? account.username ?? account.platform;
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <p className="font-medium text-emerald-700 text-sm">
          Connection confirmed
        </p>
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
          {goal === "auto_dm"
            ? "Your Instagram automation workspace is ready"
            : "You’re ready to publish"}
        </h1>
        <p className="max-w-xl text-muted-foreground leading-relaxed">
          Your account is connected and the right workflow is ready. Review the
          available plans to activate your workspace.
        </p>
      </div>

      <div className="-mx-5 border-zinc-950/10 border-t-[1.5px] border-dotted sm:-mx-6 dark:border-white/10" />

      <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
        <span className="flex size-11 items-center justify-center rounded-lg bg-background">
          <SocialIcon
            size="md"
            type={account.platform as SupportedSocialPlatform}
          />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{name}</span>
          <span className="block text-muted-foreground text-sm">
            {account.platform.charAt(0) +
              account.platform.slice(1).toLowerCase()}{" "}
            connected
          </span>
        </span>
      </div>
    </div>
  );
}
