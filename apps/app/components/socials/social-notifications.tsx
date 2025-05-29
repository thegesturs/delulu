'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  internal_error: {
    title: 'Internal Error',
    description: 'An unexpected error occurred. Please try again later.',
  },
};

const NOTIFICATIONS = {
  account_transferred: {
    title: 'Twitter Account Transferred',
    description:
      'Your Twitter account was previously connected to a different user and has been successfully transferred to your current account.',
  },
};

export function SocialNotifications() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Reset visibility when search params change
  useEffect(() => {
    setVisible(true);
  }, [searchParams]);

  const error = searchParams.get('error');
  const notification = searchParams.get('notification');

  if (!visible) {
    return null;
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    // Refresh the page to retry the connection
    window.location.reload();
  };

  if (error && ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES]) {
    const errorMessage = ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES];
    const showRetry = retryCount < 3; // Only show retry button if we haven't tried 3 times

    return (
      <div className="mb-6">
        <SocialError
          title={errorMessage.title}
          message={
            showRetry
              ? errorMessage.description
              : `${errorMessage.description} If this issue persists, please contact our support team.`
          }
          showRetry={showRetry}
          showBackToSocials={true}
          retryAction={handleRetry}
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
          showRetry={false}
          showBackToSocials={true}
        />
      </div>
    );
  }

  return null;
}
