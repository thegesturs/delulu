'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SocialErrorProps {
  title: string;
  message: string;
  showRetry?: boolean;
  showBackToSocials?: boolean;
  retryAction?: () => void;
}

export function SocialError({
  title,
  message,
  showRetry = true,
  showBackToSocials = true,
  retryAction,
}: SocialErrorProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center bg-background p-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="mt-6 text-center font-semibold text-foreground text-xl">
        {title}
      </h1>
      <p className="mt-2 max-w-md text-center text-muted-foreground text-sm">
        {message}
      </p>
      <div className="mt-6 flex gap-4">
        {showRetry && (
          <Button onClick={retryAction} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        {showBackToSocials && (
          <Button onClick={() => router.push('/socials')} variant="default">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Connected Accounts
          </Button>
        )}
      </div>
    </div>
  );
}
