'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { AlertTriangle, XCircle } from 'lucide-react';

interface SocialErrorProps {
  title: string;
  message: string;
  variant?: 'error' | 'warning';
  showRetry?: boolean;
  provider?: 'TWITTER' | 'LINKEDIN' | 'YOUTUBE';
  onRetry?: (provider?: 'TWITTER' | 'LINKEDIN' | 'YOUTUBE') => void;
  onDismiss?: () => void;
}

export function SocialError({
  title,
  message,
  variant = 'error',
  showRetry = false,
  provider,
  onRetry,
  onDismiss,
}: SocialErrorProps) {
  return (
    <div className="relative rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {variant === 'error' ? (
            <XCircle className="h-5 w-5 text-destructive" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{title}</h3>
          <p className="mt-1 text-muted-foreground text-sm">{message}</p>
          {showRetry && onRetry && (
            <div className="mt-3">
              <Button
                className="h-8 text-xs"
                onClick={() => onRetry(provider)}
                size="sm"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
            type="button"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
