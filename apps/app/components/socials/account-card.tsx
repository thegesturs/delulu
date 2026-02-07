"use client";

import type { Id } from "@delulu/database/convex/_generated/dataModel";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@delulu/design-system/components/ui/avatar";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import { Card, CardContent } from "@delulu/design-system/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@delulu/design-system/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@delulu/design-system/components/ui/tooltip";
import {
  socialBackgroundColors,
  socialIcons,
} from "@delulu/design-system/lib/social-config";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Alert01Icon,
  ClockIcon,
  Delete01Icon,
  MoreHorizontalIcon,
  Reload,
  TickDouble01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/trpc/react";
import type { SocialProvider } from "@/types/convex";
import DeleteAlertDialog from "../alerts/delete-post";

function formatTimeAgo(timestamp: number | null | undefined): string {
  if (!timestamp) {
    return "Never";
  }

  const now = Date.now();
  const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));

  if (diffInMinutes < 1) {
    return "Just now";
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

function isExpiringSoon(expiresIn: number | undefined): boolean {
  if (!expiresIn) {
    return false;
  }
  const now = Date.now();
  const diffInDays = Math.floor((expiresIn - now) / (1000 * 60 * 60 * 24));
  return diffInDays <= 7 && diffInDays > 0;
}

function isExpired(expiresIn: number | undefined): boolean {
  if (!expiresIn) {
    return false;
  }
  return Date.now() > expiresIn;
}

function ReconnectMenuItem({ socialType }: { socialType: string }) {
  const { data: connectUrl } =
    api.socialProvider.getSocialProviderConnectUrl.useQuery(
      {
        // biome-ignore lint/suspicious/noExplicitAny: required for tRPC type compatibility
        provider: socialType as any,
      },
      {
        enabled: socialType !== "LENS" && socialType !== "DEFAULT",
      }
    );

  if (!connectUrl || socialType === "LENS" || socialType === "DEFAULT") {
    return (
      <DropdownMenuItem className="cursor-not-allowed" disabled>
        <Icon className="mr-2" icon={Reload} size={16} />
        Reconnect
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem asChild className="cursor-pointer">
      <Link href={connectUrl}>
        <Icon className="mr-2" icon={Reload} size={16} />
        Reconnect
      </Link>
    </DropdownMenuItem>
  );
}

interface AccountCardProps {
  account: SocialProvider;
  onDelete: (socialId: Id<"socialProviders">) => void;
}

export function AccountCard({ account, onDelete }: AccountCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const SocialIcon =
    socialIcons[account.socialType as keyof typeof socialIcons];
  const isAccountExpired = isExpired(account.refreshTokenExpiresIn);
  const isAccountExpiringSoon = isExpiringSoon(account.refreshTokenExpiresIn);

  return (
    <Card className="group background-blue-sm background-blur shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-card/80 hover:shadow-md">
      <CardContent className="p-4 py-2">
        <div className="flex items-center gap-3">
          {/* Social Platform Icon */}
          <div className="relative">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                socialBackgroundColors[
                  account.socialType as keyof typeof socialBackgroundColors
                ]
              } shadow-sm`}
            >
              <SocialIcon className="h-5 w-5 text-white" />
            </div>
            {isAccountExpired && (
              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive">
                <Icon
                  className="text-destructive-foreground"
                  icon={Alert01Icon}
                  size={10}
                />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar className="size-12 border-2 border-background shadow-sm">
              <AvatarImage
                alt={account.fullName || ""}
                src={account.profileImage || "/placeholder.svg"}
              />
              <AvatarFallback className="bg-muted text-xs">
                {account.fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "?"}
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
                        <Icon
                          className="flex-shrink-0 text-green-600 dark:text-green-400"
                          icon={TickDouble01Icon}
                          size={14}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Last synced{" "}
                          {formatTimeAgo(
                            account.lastSyncedAt ?? account.updatedAt
                          )}{" "}
                          and is active
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Icon
                    className="flex-shrink-0 text-muted-foreground"
                    icon={ClockIcon}
                    size={14}
                  />
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
                <Badge className="px-2 py-0.5 text-xs" variant="destructive">
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
                <Badge className="px-2 py-0.5 text-xs" variant="secondary">
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
                  className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:text-foreground/80 group-hover:opacity-100"
                  size="icon"
                  variant="ghost"
                >
                  <Icon className="" icon={MoreHorizontalIcon} size={16} />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <ReconnectMenuItem socialType={account.socialType} />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Icon className="mr-2" icon={Delete01Icon} size={16} />
                  Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
      <DeleteAlertDialog
        description="Are you sure you want to delete this account? This action cannot be undone."
        isLoading={isDeleting}
        onConfirm={() => {
          setIsDeleting(true);
          onDelete(account._id);
        }}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Delete Account"
      />
    </Card>
  );
}
