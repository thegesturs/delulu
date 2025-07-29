'use client';

import { api } from '@/trpc/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SocialError } from '../error/social-error';

const ERROR_MESSAGES = {
  auth_required: {
    title: 'Authentication Required',
    description: 'Please sign in to connect your social accounts.',
  },
  invalid_request: {
    title: 'Invalid Request',
    description: 'Some required parameters are missing. Please try again.',
  },
  twitter_auth_failed: {
    title: 'Twitter Authentication Failed',
    description:
      'We encountered an error while connecting to Twitter. Please try again.',
  },
  twitter_token_invalid: {
    title: 'Invalid Twitter Token',
    description:
      'The authentication token from Twitter was invalid. Please try reconnecting.',
  },
  twitter_user_fetch_failed: {
    title: 'Failed to Fetch Twitter Profile',
    description:
      'We could not fetch your Twitter profile information. Please try again.',
  },
  youtube_auth_failed: {
    title: 'YouTube Authentication Failed',
    description:
      'We encountered an error while connecting to YouTube. Please try again.',
  },
  youtube_insufficient_permissions: {
    title: 'Insufficient YouTube Permissions',
    description:
      'You must grant all requested permissions to connect your YouTube account. Please try again and make sure to select all permissions.',
  },
  youtube_user_fetch_failed: {
    title: 'Failed to Fetch YouTube Profile',
    description:
      'We could not fetch your YouTube profile information. Please try again.',
  },
  youtube_no_channel: {
    title: 'No YouTube Channel Found',
    description:
      'You need to create a YouTube channel first. Please visit YouTube.com to create a channel, then try connecting again.',
  },
  internal_error: {
    title: 'Internal Error',
    description: 'An unexpected error occurred. Please try again later.',
  },
  user_cancelled: {
    title: 'Connection Cancelled',
    description: 'You cancelled the social account connection process.',
  },
};

const NOTIFICATIONS = {
  account_transferred: {
    title: 'Twitter Account Transferred',
    description:
      'Your Twitter account was previously connected to a different user and has been successfully transferred to your current account.',
  },
};

function SocialNotificationsContent() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const connectAccountMutation =
    api.socialProvider.getSocialProviderConnectUrl.useMutation();

  // Reset visibility when search params change
  useEffect(() => {
    setVisible(true);
  }, [searchParams]);

  console.log('searchParams', searchParams);

  const error = searchParams.get('error');
  const notification = searchParams.get('notification');
  const provider = searchParams.get('provider') as
    | 'TWITTER'
    | 'LINKEDIN'
    | 'YOUTUBE'
    | null;

  console.log('error', error);
  console.log('notification', notification);
  console.log('provider', provider);

  if (!visible) {
    return null;
  }

  const handleRetry = async (socialProvider?: 'TWITTER' | 'LINKEDIN' | 'YOUTUBE') => {
    setRetryCount((prev) => prev + 1);
    // Use the provider from URL params or the one passed from the retry button
    const providerToUse = socialProvider || provider;
    if (providerToUse) {
      try {
        toast.loading('Connecting to social account...');
        connectAccountMutation.mutate(
          { provider: providerToUse },
          {
            onSuccess: (data) => {
              window.location.href = data;
              toast.dismiss();
            },
            onError: (error) => {
              toast.dismiss();
              toast.error('Failed to connect to social account');
              if (process.env.NODE_ENV === 'development') {
                console.error('Failed to get connect URL:', error);
              }
            },
          }
        );
      } catch (error) {
        toast.dismiss();
        toast.error('Failed to connect to social account');
      }
    }
  };

  if (error && ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES]) {
    const errorMessage = ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES];
    const showRetry = retryCount < 3 && provider !== null; // Only show retry if we have provider info

    return (
      <div className="mb-6">
        <SocialError
          title={errorMessage.title}
          message={
            showRetry
              ? errorMessage.description
              : `${errorMessage.description} If this issue persists, please contact our support team.`
          }
          variant="error"
          showRetry={showRetry}
          provider={provider || undefined}
          onRetry={handleRetry}
          onDismiss={() => setVisible(false)}
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
          title={notificationMessage.title}
          message={notificationMessage.description}
          variant="warning"
          showRetry={false}
          onDismiss={() => setVisible(false)}
        />
      </div>
    );
  }

  return null;
}

export function SocialNotifications() {
  console.log('SocialNotifications');
  return (
    <Suspense>
      <SocialNotificationsContent />
    </Suspense>
  );
}
