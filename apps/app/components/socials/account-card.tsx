'use client';

import type { SocialProvider } from '@delulu/database';
import type { SocialType } from '@delulu/database/schema';
import {} from '@delulu/design-system/components/ui/alert-dialog';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@delulu/design-system/components/ui/avatar';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import { Card, CardContent } from '@delulu/design-system/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@delulu/design-system/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@delulu/design-system/components/ui/tooltip';
import { TooltipProvider } from '@delulu/design-system/components/ui/tooltip';
import {
  socialColors,
  socialIcons,
} from '@delulu/design-system/lib/social-config';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import DeleteAlertDialog from '../alerts/delete-post';

function formatTimeAgo(date: Date | null): string {
  if (!date) {
    return 'Never';
  }

  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) {
    return 'Just now';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

function isExpiringSoon(expiresIn: Date): boolean {
  const now = new Date();
  const diffInDays = Math.floor(
    (expiresIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffInDays <= 7 && diffInDays > 0;
}

function isExpired(expiresIn: Date): boolean {
  return new Date() > expiresIn;
}

interface AccountCardProps {
  account: SocialProvider;
  onConnect: (platform: SocialType) => void;
  onDelete: (socialId: string) => void;
}

export function AccountCard({
  account,
  onConnect,
  onDelete,
}: AccountCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const SocialIcon =
    socialIcons[account.socialType as keyof typeof socialIcons];
  const isAccountExpired = account.refreshTokenExpiresIn
    ? isExpired(account.refreshTokenExpiresIn)
    : false;
  const isAccountExpiringSoon = account.refreshTokenExpiresIn
    ? isExpiringSoon(account.refreshTokenExpiresIn)
    : false;

  return (
    <Card className="group hover:-translate-y-0.5 background-blue-sm background-blur shadow-sm transition-all duration-300 hover:bg-card/80 hover:shadow-md">
      <CardContent className="p-4 py-2">
        <div className="flex items-center gap-3">
          {/* Social Platform Icon */}
          <div className="relative">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                socialColors[account.socialType as keyof typeof socialColors]
              } shadow-sm`}
            >
              <SocialIcon className="h-5 w-5 text-white" />
            </div>
            {isAccountExpired && (
              <div className="-top-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-destructive">
                <AlertTriangle className="h-2.5 w-2.5 text-destructive-foreground" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar className="size-12 border-2 border-background shadow-sm">
              <AvatarImage
                src={account.profileImage || '/placeholder.svg'}
                alt={account.fullName || ''}
              />
              <AvatarFallback className="bg-muted text-xs">
                {account.fullName
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('') || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-foreground text-sm">
                  {account.fullName}
                </p>
                {account.isActive && !isAccountExpired ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Last synced{' '}
                          {formatTimeAgo(
                            account.lastSyncedAt ?? account.updatedAt
                          )}{' '}
                          and is active
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Clock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                )}
              </div>
              <p className="truncate text-muted-foreground text-xs">
                {account.username}
              </p>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              {isAccountExpired ? (
                <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                  Expired
                </Badge>
              ) : isAccountExpiringSoon ? (
                <Badge className="bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 hover:bg-yellow-200">
                  Expires soon
                </Badge>
              ) : account.isActive ? (
                <Badge className="bg-green-100 px-2 py-0.5 text-green-800 text-xs hover:bg-green-200">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                  Inactive
                </Badge>
              )}
              <p className="mt-1 text-muted-foreground text-xs">
                {formatTimeAgo(account.lastSyncedAt ?? account.updatedAt)}
              </p>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:text-foreground/80 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => onConnect(account.socialType)}
                  className="cursor-pointer"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reconnect
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
      <DeleteAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          setIsDeleting(true);
          onDelete(account.id);
        }}
        title="Delete Account"
        description="Are you sure you want to delete this account? This action cannot be undone."
        isLoading={isDeleting}
      />
    </Card>
  );
}
