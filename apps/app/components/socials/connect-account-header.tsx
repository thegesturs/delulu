"use client";
import { api as ConvexApi } from "@delulu/database/convex/_generated/api";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@delulu/design-system/components/ui/dialog";
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import {
  type SupportedSocialPlatform,
  socialBackgroundColors,
  socialDescriptions,
  socialDisplayNames,
} from "@delulu/design-system/lib/social-config";
import { Icon } from "@delulu/design-system/providers/icon";
import { Plus } from "@hugeicons-pro/core-solid-rounded";
import { useQuery } from "convex-helpers/react/cache";
import Link from "next/link";
import { InlineUpgradePrompt } from "@/components/billing/upgrade-prompt";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { api } from "@/trpc/react";

const ALL_SOCIAL_PLATFORMS: SupportedSocialPlatform[] = [
  "TWITTER",
  "LINKEDIN",
  "TIKTOK",
  "INSTAGRAM",
  "THREADS",
  "FACEBOOK",
  // 'PINTEREST',
  // 'FARCASTER',
  "YOUTUBE",
];

function useSocialPlatforms() {
  const twitterEnabled = useFeatureFlag("twitter");
  return ALL_SOCIAL_PLATFORMS.filter((p) => p !== "TWITTER" || twitterEnabled);
}

function ConnectPlatformButton({
  platform,
}: {
  platform: SupportedSocialPlatform;
}) {
  const { data: connectUrl, isLoading } =
    api.socialProvider.getSocialProviderConnectUrl.useQuery({
      provider: platform,
    });

  if (platform === "FARCASTER") {
    return (
      <Button
        className="flex h-14 items-center justify-start space-x-4 px-4"
        disabled
        variant="outline"
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            socialBackgroundColors[platform]
          } shadow-sm`}
        >
          <SocialIcon className="text-white" size="md" type={platform} />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium">{socialDisplayNames[platform]}</span>
          <span className="text-muted-foreground text-sm">
            {socialDescriptions[platform]}
          </span>
        </div>
      </Button>
    );
  }

  if (isLoading || !connectUrl) {
    return (
      <Button
        className="flex h-14 items-center justify-start space-x-4 px-4"
        disabled
        variant="outline"
      >
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            socialBackgroundColors[platform]
          } shadow-sm`}
        >
          <SocialIcon className="text-white" size="md" type={platform} />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium">{socialDisplayNames[platform]}</span>
          <span className="text-muted-foreground text-sm">
            {socialDescriptions[platform]}
          </span>
        </div>
      </Button>
    );
  }

  return (
    <Button
      asChild
      className="flex h-14 items-center justify-start space-x-4 px-4"
      variant="outline"
    >
      <Link href={connectUrl}>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            socialBackgroundColors[platform]
          } shadow-sm`}
        >
          <SocialIcon className="text-white" size="md" type={platform} />
        </div>
        <div className="flex flex-col items-start">
          <span className="font-medium">{socialDisplayNames[platform]}</span>
          <span className="text-muted-foreground text-sm">
            {socialDescriptions[platform]}
          </span>
        </div>
      </Link>
    </Button>
  );
}

export function ConnectedAccountsHeader() {
  // Check limit with single efficient query
  const limitCheck = useQuery(ConvexApi.subscriptions.checkSocialAccountLimit);
  const isAtLimit = !limitCheck?.allowed;
  const _accountCount = limitCheck?.currentCount || 0;
  const platforms = useSocialPlatforms();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-bold text-foreground text-xl tracking-tight md:text-3xl">
            Connected Accounts
          </h1>
          <p className="mt-0.5 hidden text-muted-foreground text-sm md:block">
            Manage your social media connections and sync settings
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button disabled={isAtLimit}>
              <Icon className="mr-2" icon={Plus} size={16} />
              Connect Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Social Account</DialogTitle>
              <DialogDescription>
                {isAtLimit
                  ? `You've reached your ${limitCheck?.planType} plan limit of ${limitCheck?.limit} social accounts`
                  : "All connections use official platform APIs. Your passwords never touch our servers."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              {isAtLimit ? (
                <InlineUpgradePrompt feature="socialAccounts" />
              ) : (
                platforms.map((platform) => (
                  <ConnectPlatformButton key={platform} platform={platform} />
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
