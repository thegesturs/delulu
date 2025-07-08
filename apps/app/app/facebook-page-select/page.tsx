'use client';

import { FacebookPageSelect } from '@/components/socials/facebook-page-select';
import { Alert, AlertDescription, AlertTitle } from '@delulu/design-system/components/ui/alert';
import { Button } from '@delulu/design-system/components/ui/button';
import type { FacebookPagesPublic } from '@delulu/validators/facebook';
import { TriangleAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';


export default function FacebookPageSelectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const key = searchParams.get('key');
  const code = searchParams.get('code');

  const { data: pages, error, refetch, isLoading } = useQuery<FacebookPagesPublic>({
    queryKey: ['facebook-pages', key],
    queryFn: async () => {
      if (!key) {
        return [];
      }
      const response = await fetch('/api/facebook/pages?key=' + key);
      if (!response.ok) {
        throw new Error('Failed to fetch page data');
      }
      return response.json();
    },
    enabled: !!key,
    retry: false, // Disable automatic retries to prevent excessive requests
  });

  // Render error UI instead of redirecting
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Failed to Load Facebook Pages</AlertTitle>
            <AlertDescription>
              We couldn't load your Facebook pages. This might be due to a temporary issue
              or an expired session.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button 
              onClick={() => refetch()} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Retrying...' : 'Try Again'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/socials')}
              className="flex-1"
            >
              Back to Social Accounts
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              If the problem persists, you may need to{' '}
              <Button
                variant="link"
                className="h-auto p-0 text-sm underline"
                onClick={() => router.push('/socials')}
              >
                reconnect your Facebook account
              </Button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!key || !code || !pages?.length) {
    return null;
  }

  return <FacebookPageSelect pages={pages} code={code} />;
}
