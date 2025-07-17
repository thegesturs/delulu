'use client';

import { api } from '@/trpc/react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@delulu/design-system/components/ui/avatar';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@delulu/design-system/components/ui/dialog';
import { Input } from '@delulu/design-system/components/ui/input';
import { ScrollArea } from '@delulu/design-system/components/ui/scroll-area';
import type { FacebookPagePublic } from '@delulu/validators/facebook';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaFacebookF } from 'react-icons/fa6';
import { toast } from 'sonner';

interface FacebookPageSelectProps {
  pages: FacebookPagePublic[];
  code: string;
}

function formatNumber(num?: number): string {
  if (!num) {
    return '0';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function FacebookPageSelect({ pages, code }: FacebookPageSelectProps) {
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
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

  const handleCancel = () => {
    setIsCancelling(true);
    router.push('/socials?error=user_cancelled&provider=facebook');
  };

  const handleConfirm = () => {
    const selectedPage = pages.find((page) => page.id === selectedPageId);
    if (!selectedPage) {
      toast.error('No page selected');
      return;
    }

    connectPage({
      pageId: selectedPage.id,
      pageName: selectedPage.name,
      code,
    });
  };

  const filteredPages = pages.filter(
    (page) =>
      page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
              <FaFacebookF className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Select Facebook Page
              </DialogTitle>
              <DialogDescription className="mt-1">
                Choose the Facebook page you want to connect to your account
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filteredPages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setSelectedPageId(page.id)}
                className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                  selectedPageId === page.id
                    ? 'border-primary bg-accent'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={page.picture?.data.url} alt={page.name} />
                    <AvatarFallback>
                      {page.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium">{page.name}</h3>
                      {page.verification_status === 'verified' && (
                        <Badge variant="default" className="bg-blue-600">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-muted-foreground text-sm">
                      {page.category}
                    </p>
                    <div className="mt-1 flex items-center gap-4 text-muted-foreground text-xs">
                      <span>
                        {formatNumber(page.followers_count)} followers
                      </span>
                      <span>{formatNumber(page.fan_count)} likes</span>
                    </div>
                  </div>
                  {selectedPageId === page.id && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                      <svg
                        className="h-4 w-4 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6 flex items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel'}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedPageId || isPending}
            className="min-w-[100px]"
          >
            {isPending ? 'Connecting...' : 'Connect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
