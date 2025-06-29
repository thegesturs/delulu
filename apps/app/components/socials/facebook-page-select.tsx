'use client';

import { api } from '@/trpc/react';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@delulu/design-system/components/ui/dialog';
import {
  RadioGroup,
  RadioGroupItem,
} from '@delulu/design-system/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
}

interface FacebookPageSelectProps {
  pages: FacebookPage[];
  code: string;
}

export function FacebookPageSelect({ pages, code }: FacebookPageSelectProps) {
  const [selectedPageId, setSelectedPageId] = useState<string>(pages[0]?.id);
  const router = useRouter();

  const { mutate: connectPage, isPending } =
    api.socialProvider.connectFacebookPage.useMutation({
      onSuccess: () => {
        router.push('/socials?success=true&provider=facebook');
      },
      onError: (error) => {
        router.push(
          `/socials?error=${error.message}&code=FACEBOOK_006&provider=facebook`
        );
      },
    });

  const handleConfirm = () => {
    const selectedPage = pages.find((page) => page.id === selectedPageId);
    if (!selectedPage) return;

    connectPage({
      pageId: selectedPage.id,
      pageName: selectedPage.name,
      pageAccessToken: selectedPage.access_token,
      code,
    });
  };

  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Facebook Page</DialogTitle>
          <DialogDescription>
            Choose the Facebook page you want to connect to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <RadioGroup
            value={selectedPageId}
            onValueChange={setSelectedPageId}
            className="space-y-4"
          >
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center space-x-4 rounded-lg border p-4"
              >
                <RadioGroupItem value={page.id} id={page.id} />
                <div className="flex-1">
                  <label
                    htmlFor={page.id}
                    className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {page.name}
                  </label>
                  <p className="text-muted-foreground text-sm">
                    {page.category}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            onClick={() =>
              router.push(
                '/socials?error=user_cancelled&code=FACEBOOK_007&provider=facebook'
              )
            }
            variant="outline"
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Connecting...' : 'Connect Page'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
