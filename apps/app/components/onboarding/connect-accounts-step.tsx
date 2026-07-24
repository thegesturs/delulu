"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@delulu/design-system/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@delulu/design-system/components/ui/alert-dialog";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@delulu/design-system/components/ui/collapsible";
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import type { SupportedSocialPlatform } from "@delulu/design-system/lib/social-config";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  RefreshIcon,
} from "@delulu/icons";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/components/providers/api-client";
import { useWorkspace } from "@/components/providers/workspace";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { useUsageLimit } from "@/hooks/use-usage-limits";
import { useMutationAtom } from "@/state/resources";
import type { ConnectionView } from "@/types/workspace-views";
import type { OnboardingGoal } from "./goal-step";

const primaryPlatforms: SupportedSocialPlatform[] = [
  "INSTAGRAM",
  "TIKTOK",
  "LINKEDIN",
  "YOUTUBE",
];
const additionalPlatforms: SupportedSocialPlatform[] = [
  "THREADS",
  "FACEBOOK",
  "TWITTER",
  "PINTEREST",
  "BLUESKY",
];

export interface ConnectionCallbackState {
  readonly kind: "success" | "error" | "transfer_required";
  readonly provider: string | null;
  readonly username: string | null;
  readonly message?: string;
  readonly connectionId?: string;
  readonly sourceWorkspaceId?: string;
}

function ConnectPlatformButton({
  platform,
  blocked,
}: {
  platform: SupportedSocialPlatform;
  blocked: boolean;
}) {
  const { workspaceId } = useWorkspace();
  const { resources } = useApiClient();
  const connect = useMutationAtom(
    resources.connections.mint(workspaceId ?? "", platform)
  );

  return (
    <Button
      className="min-h-14 w-full justify-start gap-3 px-4"
      disabled={blocked || connect.isPending || !workspaceId}
      onClick={async () => {
        try {
          const result = await connect.mutateAsync({
            includeInsights: true,
            returnTarget: "onboarding-connect",
          });
          window.location.assign(result.url);
        } catch (error) {
          toast.error("Could not start the connection", {
            description: error instanceof Error ? error.message : undefined,
          });
        }
      }}
      variant="outline"
    >
      {connect.isPending ? (
        <Icon
          className="animate-spin motion-reduce:animate-none"
          icon={Loading03Icon}
          size={20}
        />
      ) : (
        <SocialIcon size="md" type={platform} />
      )}
      <span className="font-medium">
        {connect.isPending
          ? `Opening ${platform.toLowerCase()}…`
          : `Connect ${platform.charAt(0) + platform.slice(1).toLowerCase()}`}
      </span>
    </Button>
  );
}

function ConnectedAccountRow({
  account,
  onRemoved,
  replacementRequired,
}: {
  account: ConnectionView;
  onRemoved: () => Promise<unknown>;
  replacementRequired: boolean;
}) {
  const { workspaceId } = useWorkspace();
  const { resources } = useApiClient();
  const remove = useMutationAtom(
    resources.connections.remove(workspaceId ?? "")
  );
  const reconnect = useMutationAtom(
    resources.connections.mint(workspaceId ?? "", account.platform)
  );
  const name = account.displayName ?? account.username ?? account.platform;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3">
      <span className="flex size-10 items-center justify-center rounded-lg bg-background">
        <SocialIcon
          size="md"
          type={account.platform as SupportedSocialPlatform}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{name}</span>
        <span className="flex items-center gap-1 text-emerald-700 text-sm">
          <Icon icon={CheckmarkCircle01Icon} size={14} />
          Connected
        </span>
      </span>
      <Button
        className="min-h-11"
        disabled={reconnect.isPending || !workspaceId}
        onClick={async () => {
          try {
            const result = await reconnect.mutateAsync({
              includeInsights: true,
              returnTarget: "onboarding-connect",
            });
            window.location.assign(result.url);
          } catch (error) {
            toast.error("Could not start the connection", {
              description: error instanceof Error ? error.message : undefined,
            });
          }
        }}
        variant="outline"
      >
        {reconnect.isPending ? "Opening…" : "Change"}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            className="min-h-11"
            disabled={remove.isPending}
            variant="ghost"
          >
            {remove.isPending
              ? "Removing…"
              : replacementRequired
                ? "Replace connected account"
                : "Disconnect"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {replacementRequired ? `Replace ${name}?` : `Disconnect ${name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This disconnects the account from this workspace. You can connect
              its replacement immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">
              Keep account
            </AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11"
              onClick={async () => {
                try {
                  await remove.mutateAsync(account.id);
                  await onRemoved();
                  toast.success("Account disconnected");
                } catch (error) {
                  toast.error("Could not disconnect the account", {
                    description:
                      error instanceof Error ? error.message : undefined,
                  });
                }
              }}
            >
              Disconnect account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ConnectAccountsStep({
  goal,
  accounts,
  callback,
  isRefreshing,
  onRefresh,
  refreshError,
  requirementMet,
}: {
  goal: OnboardingGoal;
  accounts: readonly ConnectionView[];
  callback: ConnectionCallbackState | null;
  isRefreshing: boolean;
  onRefresh: () => Promise<unknown>;
  refreshError: string | null;
  requirementMet: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [transferCompleted, setTransferCompleted] = useState(false);
  const twitterEnabled = useFeatureFlag("twitter");
  const { workspaceId } = useWorkspace();
  const { resources } = useApiClient();
  const transfer = useMutationAtom(
    resources.connections.confirmTransfer(
      workspaceId ?? "",
      callback?.connectionId ?? ""
    )
  );
  const limit = useUsageLimit("socialAccounts", accounts.length);
  const atLimit = !limit.allowed;
  const connectedPlatforms = new Set(
    accounts.map((account) => account.platform.toUpperCase())
  );
  const eligiblePlatforms =
    goal === "auto_dm" ? (["INSTAGRAM"] as const) : primaryPlatforms;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="font-medium text-primary text-sm">
          {goal === "auto_dm" ? "Connect Instagram" : "Connect an account"}
        </p>
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
          {goal === "auto_dm"
            ? "Connect the account you’ll automate"
            : "Where do you want to publish first?"}
        </h1>
        <p className="max-w-xl text-muted-foreground leading-relaxed">
          {goal === "auto_dm"
            ? "Instagram is only required for the auto-DM workflow. We use official permissions and never receive your password."
            : "Any supported account completes setup. You can add more from account settings later."}
        </p>
      </div>

      {callback?.kind === "success" ? (
        <Alert className="border-emerald-500/25 bg-emerald-500/5" role="status">
          <Icon className="text-emerald-600" icon={CheckmarkCircle01Icon} />
          <AlertTitle>
            {requirementMet ? "Account connected" : "Connected, syncing…"}
          </AlertTitle>
          <AlertDescription>
            {callback.username
              ? `${callback.username} was authenticated successfully.`
              : "The connection was authenticated successfully."}
          </AlertDescription>
        </Alert>
      ) : null}

      {callback?.kind === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>Connection didn&apos;t finish</AlertTitle>
          <AlertDescription>
            <p>
              {callback.message ??
                "Nothing was changed. Try again when you’re ready."}
            </p>
            <Button
              className="mt-2 min-h-11"
              disabled={isRefreshing}
              onClick={onRefresh}
              variant="outline"
            >
              <Icon
                className={
                  isRefreshing
                    ? "animate-spin motion-reduce:animate-none"
                    : undefined
                }
                icon={RefreshIcon}
                size={16}
              />
              Refresh accounts
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {refreshError ? (
        <Alert variant="destructive">
          <AlertTitle>
            We couldn&apos;t confirm the latest account state
          </AlertTitle>
          <AlertDescription>
            <p>{refreshError}</p>
            <Button
              className="mt-2 min-h-11"
              disabled={isRefreshing}
              onClick={onRefresh}
              variant="outline"
            >
              <Icon
                className={
                  isRefreshing
                    ? "animate-spin motion-reduce:animate-none"
                    : undefined
                }
                icon={RefreshIcon}
                size={16}
              />
              Try refresh again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {callback?.kind === "transfer_required" && !transferCompleted ? (
        <Alert>
          <AlertTitle>Move this account to this workspace?</AlertTitle>
          <AlertDescription>
            <p>
              This account is connected to another workspace you can access.
              Moving it will disconnect it there.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                className="min-h-11"
                disabled={
                  transfer.isPending ||
                  !(callback.connectionId && callback.sourceWorkspaceId)
                }
                onClick={async () => {
                  if (!(callback.connectionId && callback.sourceWorkspaceId)) {
                    return;
                  }
                  try {
                    await transfer.mutateAsync({
                      sourceWorkspaceId: callback.sourceWorkspaceId,
                    });
                    await onRefresh();
                    setTransferCompleted(true);
                    toast.success("Account moved to this workspace");
                  } catch (error) {
                    toast.error("Could not move the account", {
                      description:
                        error instanceof Error ? error.message : undefined,
                    });
                  }
                }}
              >
                {transfer.isPending ? "Moving…" : "Move account"}
              </Button>
              <Button asChild className="min-h-11" variant="outline">
                <Link href="/socials">Review connected accounts</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {accounts.length > 0 ? (
        <div className="space-y-2">
          <p className="font-medium text-sm">Connected</p>
          {accounts.map((account) => (
            <ConnectedAccountRow
              account={account}
              key={account.id}
              onRemoved={onRefresh}
              replacementRequired={atLimit && !requirementMet}
            />
          ))}
        </div>
      ) : null}

      {atLimit && !requirementMet ? (
        <Alert>
          <AlertTitle>
            Your {limit.planType} plan includes {limit.limit} connected account
          </AlertTitle>
          <AlertDescription>
            <p>
              Replace the connected account above, or upgrade to connect another
              one. Existing accounts stay usable.
            </p>
            <Button asChild className="mt-2 min-h-11" variant="outline">
              <Link href="/billing">View upgrade options</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {requirementMet ? null : (
        <div className="space-y-3">
          {eligiblePlatforms
            .filter((platform) => !connectedPlatforms.has(platform))
            .map((platform) => (
              <ConnectPlatformButton
                blocked={atLimit}
                key={platform}
                platform={platform}
              />
            ))}

          {goal === "publish" ? (
            <Collapsible onOpenChange={setMoreOpen} open={moreOpen}>
              <CollapsibleTrigger asChild>
                <Button className="min-h-11 w-full" variant="ghost">
                  More networks
                  <Icon
                    className={moreOpen ? "rotate-180" : undefined}
                    icon={ArrowDown01Icon}
                    size={16}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                {additionalPlatforms
                  .filter(
                    (platform) => platform !== "TWITTER" || twitterEnabled
                  )
                  .filter((platform) => !connectedPlatforms.has(platform))
                  .map((platform) => (
                    <ConnectPlatformButton
                      blocked={atLimit}
                      key={platform}
                      platform={platform}
                    />
                  ))}
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </div>
      )}
    </div>
  );
}
