"use client";

import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";
import { Icon } from "@delulu/design-system/providers/icon";
import { CheckmarkCircle01Icon } from "@delulu/icons";
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
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
          <Icon
            className="text-emerald-600"
            icon={CheckmarkCircle01Icon}
            size={28}
          />
        </div>
        <p className="font-medium text-emerald-700 text-sm">Setup complete</p>
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
          {goal === "auto_dm"
            ? "Your Instagram automation workspace is ready"
            : "You’re ready to publish"}
        </h1>
        <p className="max-w-xl text-muted-foreground leading-relaxed">
          Your account is connected. Start with the guided workflow or head to
          the dashboard and explore.
        </p>
      </div>

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
