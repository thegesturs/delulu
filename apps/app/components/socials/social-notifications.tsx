"use client";

import {
  SOCIAL_ACCOUNT_CONNECTED,
  SOCIAL_ACCOUNT_CONNECTION_FAILED,
} from "@delulu/analytics/events";
import { useAnalytics } from "@delulu/analytics/posthog/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@delulu/design-system/components/ui/dialog";
import { Icon } from "@delulu/design-system/providers/icon";
import { CheckmarkCircle01Icon } from "@hugeicons-pro/core-solid-rounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useApiClient } from "@/components/providers/api-client";
import { useWorkspace } from "@/components/providers/workspace";
import { SocialError } from "../error/social-error";
import { socialSuccessCopy } from "./social-success";

const ERROR_MESSAGES = {
  auth_required: {
    title: "Authentication Required",
    description: "Please sign in to connect your social accounts.",
  },
  invalid_request: {
    title: "Invalid Request",
    description: "Some required parameters are missing. Please try again.",
  },
  twitter_auth_failed: {
    title: "Twitter Authentication Failed",
    description:
      "We encountered an error while connecting to Twitter. Please try again.",
  },
  twitter_token_invalid: {
    title: "Invalid Twitter Token",
    description:
      "The authentication token from Twitter was invalid. Please try reconnecting.",
  },
  twitter_user_fetch_failed: {
    title: "Failed to Fetch Twitter Profile",
    description:
      "We could not fetch your Twitter profile information. Please try again.",
  },
  youtube_auth_failed: {
    title: "YouTube Authentication Failed",
    description:
      "We encountered an error while connecting to YouTube. Please try again.",
  },
  youtube_insufficient_permissions: {
    title: "Insufficient YouTube Permissions",
    description:
      "You must grant all requested permissions to connect your YouTube account. Please try again and make sure to select all permissions.",
  },
  youtube_user_fetch_failed: {
    title: "Failed to Fetch YouTube Profile",
    description:
      "We could not fetch your YouTube profile information. Please try again.",
  },
  youtube_no_channel: {
    title: "No YouTube Channel Found",
    description:
      "You need to create a YouTube channel first. Please visit YouTube.com to create a channel, then try connecting again.",
  },
  internal_error: {
    title: "Internal Error",
    description: "An unexpected error occurred. Please try again later.",
  },
  user_cancelled: {
    title: "Connection Cancelled",
    description: "You cancelled the social account connection process.",
  },
};

const NOTIFICATIONS = {
  account_transferred: {
    title: "Twitter Account Transferred",
    description:
      "Your Twitter account was previously connected to a different user and has been successfully transferred to your current account.",
  },
};

function SocialNotificationsContent() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);
  const [callbackUsername, setCallbackUsername] = useState<string | null>(null);
  const [callbackReady, setCallbackReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const analytics = useAnalytics();
  const { workspaceId } = useWorkspace();
  const { resources } = useApiClient();
  const queryClient = useQueryClient();
  const trackedRef = useRef(false);
  const invalidatedRef = useRef(false);

  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const notification = searchParams.get("notification");
  const provider = searchParams.get("provider");
  const client = searchParams.get("client");
  const callbackClient =
    client === "cli" || client === "mcp" ? client : undefined;

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const connectedUsername = fragment.get("username");
    setCallbackUsername(connectedUsername);
    if (connectedUsername) {
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}`
      );
    }
    setCallbackReady(true);
    setVisible(true);
  }, [success, provider, client]);

  // Track social account connection/failure via PostHog
  useEffect(() => {
    if (trackedRef.current) {
      return;
    }
    if (success === "true" && provider) {
      trackedRef.current = true;
      analytics.capture(SOCIAL_ACCOUNT_CONNECTED, {
        provider: provider.toLowerCase(),
      });
    } else if (error && provider) {
      trackedRef.current = true;
      analytics.capture(SOCIAL_ACCOUNT_CONNECTION_FAILED, {
        provider: provider.toLowerCase(),
        error_type: error,
      });
    }
  }, [success, error, provider, analytics]);

  // The OAuth callback lands back here (a full-page redirect) after a connect,
  // transfer, or failure. Drop the cached connections list once so the freshly
  // connected account — or its absence, on failure — shows without a manual
  // reload, regardless of browser back/forward cache.
  useEffect(() => {
    if (invalidatedRef.current || !workspaceId) {
      return;
    }
    if (success === "true" || notification || error) {
      invalidatedRef.current = true;
      queryClient.invalidateQueries({
        queryKey: resources.connections.list(workspaceId).queryKey,
      });
    }
  }, [success, notification, error, workspaceId, queryClient, resources]);

  // Fetch the connect URL if we have a provider and might need to retry
  const connect = useMutation(
    resources.connections.mint(workspaceId ?? "", provider ?? "TWITTER")
  );

  if (!visible) {
    return null;
  }

  const handleRetry = async (socialProvider?: string) => {
    setRetryCount((prev) => prev + 1);
    // Use the provider from URL params or the one passed from the retry button
    const providerToUse = socialProvider || provider;
    if (providerToUse && workspaceId) {
      const result = await connect.mutateAsync({
        includeInsights: true,
        client: callbackClient,
      });
      window.location.href = result.url;
    }
  };

  if (error && ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES]) {
    const errorMessage = ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES];
    const showRetry = retryCount < 3 && provider !== null; // Only show retry if we have provider info

    return (
      <div className="mb-6">
        <SocialError
          message={
            showRetry
              ? errorMessage.description
              : `${errorMessage.description} If this issue persists, please contact our support team.`
          }
          onDismiss={() => setVisible(false)}
          onRetry={handleRetry}
          provider={provider || undefined}
          showRetry={showRetry}
          title={errorMessage.title}
          variant="error"
        />
      </div>
    );
  }

  if (
    notification &&
    NOTIFICATIONS[notification as keyof typeof NOTIFICATIONS]
  ) {
    const notificationMessage =
      NOTIFICATIONS[notification as keyof typeof NOTIFICATIONS];

    return (
      <div className="mb-6">
        <SocialError
          message={notificationMessage.description}
          onDismiss={() => setVisible(false)}
          showRetry={false}
          title={notificationMessage.title}
          variant="warning"
        />
      </div>
    );
  }

  if (success === "true" && provider && callbackReady) {
    const copy = socialSuccessCopy({
      provider,
      username: callbackUsername,
      client,
    });
    return (
      <Dialog onOpenChange={setVisible} open={visible}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
              <Icon
                className="text-emerald-500"
                icon={CheckmarkCircle01Icon}
                size={28}
              />
            </div>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.message}</DialogDescription>
          </DialogHeader>
          {copy.detail ? (
            <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center text-foreground text-sm">
              {copy.detail}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

export function SocialNotifications() {
  return (
    <Suspense>
      <SocialNotificationsContent />
    </Suspense>
  );
}
