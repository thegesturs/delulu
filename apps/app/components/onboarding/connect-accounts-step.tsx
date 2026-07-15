"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";
import { useEffect } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/components/providers/api-client";
import { useWorkspace } from "@/components/providers/workspace";
import { useUsageLimit } from "@/hooks/use-usage-limits";
import { useMutationAtom, useResourceAtom } from "@/state/resources";
import { useOnboardingStore } from "@/store/onboarding";

const platforms: SupportedSocialPlatform[] = [
  "INSTAGRAM",
  "TIKTOK",
  "LINKEDIN",
  "YOUTUBE",
  "THREADS",
  "FACEBOOK",
  "TWITTER",
];

function ConnectButton({
  platform,
  connected,
  disabled,
}: {
  platform: SupportedSocialPlatform;
  connected: boolean;
  disabled: boolean;
}) {
  const { workspaceId } = useWorkspace();
  const { resources } = useApiClient();
  const connect = useMutationAtom(
    resources.connections.mint(workspaceId ?? "", platform)
  );
  return (
    <Button
      className="h-14 justify-start gap-3"
      disabled={connected || disabled || connect.isPending || !workspaceId}
      onClick={async () => {
        try {
          const result = await connect.mutateAsync({ includeInsights: true });
          window.location.assign(result.url);
        } catch (error) {
          toast.error("Could not start account connection", {
            description: error instanceof Error ? error.message : undefined,
          });
        }
      }}
      variant="outline"
    >
      <SocialIcon size="md" type={platform} />
      <span>{connected ? `${platform} connected` : `Connect ${platform}`}</span>
    </Button>
  );
}

export function ConnectAccountsStep() {
  const { workspaceId } = useWorkspace();
  const { resources } = useApiClient();
  const setAccountsConnected = useOnboardingStore(
    (state) => state.setAccountsConnected
  );
  const accounts = useResourceAtom({
    ...resources.connections.list(workspaceId ?? "", { limit: 100 }),
    enabled: Boolean(workspaceId),
  });
  const values = accounts.data?.data ?? [];
  const limit = useUsageLimit("socialAccounts", values.length);
  useEffect(
    () => setAccountsConnected(values.length),
    [setAccountsConnected, values.length]
  );
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="font-bold text-3xl">Connect Instagram First</h2>
        <p className="text-muted-foreground">
          Instagram is required for auto-DM automations. Add other platforms
          anytime.
        </p>
      </div>
      {accounts.isError && (
        <p className="text-center text-destructive">
          {accounts.error?.message ?? "Accounts could not be loaded"}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {platforms.map((platform) => (
          <ConnectButton
            connected={values.some((item) => item.platform === platform)}
            disabled={!limit.allowed}
            key={platform}
            platform={platform}
          />
        ))}
      </div>
    </div>
  );
}
