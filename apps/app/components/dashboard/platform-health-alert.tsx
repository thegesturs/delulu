'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@delulu/design-system/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlatformHealthAlertProps {
  expiredTokens: number;
}

export function PlatformHealthAlert({
  expiredTokens,
}: PlatformHealthAlertProps) {
  const router = useRouter();

  if (expiredTokens === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <CardTitle className="text-amber-800 dark:text-amber-200">
            Platform Connection Issues
          </CardTitle>
        </div>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          {expiredTokens} social account
          {expiredTokens > 1 ? 's need' : ' needs'} to be reconnected
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-amber-700 text-sm dark:text-amber-300">
            Some of your social media accounts have expired authentication
            tokens. Posts may fail to publish until these are reconnected.
          </p>
          <Button
            onClick={() => router.push('/socials')}
            size="sm"
            className="ml-4"
          >
            Fix Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
