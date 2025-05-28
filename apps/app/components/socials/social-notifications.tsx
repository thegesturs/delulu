'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@delulu/design-system/components/ui/alert';
import { AlertTriangle, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  internal_error: {
    title: 'Internal Error',
    description: 'An unexpected error occurred. Please try again later.',
  },
};

const NOTIFICATIONS = {
  account_transferred: {
    title: 'Account Transferred',
    description:
      'This social account was previously connected to a different user and has been transferred to your account.',
  },
};

export function SocialNotifications() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);

  // Reset visibility when search params change
  useEffect(() => {
    setVisible(true);
  }, [searchParams]);

  const error = searchParams.get('error');
  const code = searchParams.get('code');
  const notification = searchParams.get('notification');
  const platform = searchParams.get('platform');

  if (!visible) {
    return null;
  }

  if (error && ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES]) {
    const errorMessage = ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES];
    return (
      <Alert variant="destructive" className="mb-6">
        <XCircle className="h-4 w-4" />
        <AlertTitle>{errorMessage.title}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            {errorMessage.description}
            {code && (
              <span className="ml-2 text-xs opacity-70">Code: {code}</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-xs hover:underline"
          >
            Dismiss
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  if (
    notification &&
    NOTIFICATIONS[notification as keyof typeof NOTIFICATIONS]
  ) {
    const notificationMessage =
      NOTIFICATIONS[notification as keyof typeof NOTIFICATIONS];
    return (
      <Alert className="mb-6 border-yellow-500 bg-yellow-500/10 text-yellow-700">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{notificationMessage.title}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            {notificationMessage.description}
            {platform && (
              <span className="ml-2 text-xs opacity-70">
                Platform: {platform}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-xs hover:underline"
          >
            Dismiss
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
