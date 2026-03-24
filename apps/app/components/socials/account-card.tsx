"use client";

import { api as convexApi } from "@delulu/database/convex/_generated/api";
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  ArrowRight01Icon,
  ClockIcon,
  Delete01Icon,
  MoreHorizontalIcon,
  Reload,
  TickDouble01Icon,
  UserIcon,
} from "@hugeicons-pro/core-solid-rounded";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
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
  const orgs = useQuery(convexApi.organizations.getUserOrganizations);
  const transferMutation = useMutation(
    convexApi.social_providers.transferSocialProvider
  );
  const isInOrg = !!account.organizationId;
  const SocialIcon =
    socialIcons[account.socialType as keyof typeof socialIcons];
  const isAccountExpired = isExpired(account.refreshTokenExpiresIn);
  const isAccountExpiringSoon = isExpiringSoon(account.refreshTokenExpiresIn);

  return (
    <Card className="group gap-0 rounded-none border-x-0 border-t-0 border-b py-2 shadow-none last:border-b-0 hover:bg-muted/30">
      <CardContent className="px-3 py-1.5 md:px-4 md:py-2.5">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Social Platform Icon */}
          <div className="relative">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg md:h-10 md:w-10 md:rounded-xl ${
                socialBackgroundColors[
                  account.socialType as keyof typeof socialBackgroundColors
                ]
              } shadow-sm`}
            >
              <SocialIcon className="h-3.5 w-3.5 text-white md:h-5 md:w-5" />
            </div>
            {isAccountExpired && (
              <div className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-destructive md:-top-1 md:-right-1 md:h-4 md:w-4">
                <Icon
                  className="text-destructive-foreground"
                  icon={Alert01Icon}
                  size={8}
                />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
            <Avatar className="hidden size-8 border border-background md:flex md:size-12 md:border-2 md:shadow-sm">
              <AvatarImage
                alt={account.fullName || ""}
                src={account.profileImage || "/placeholder.svg"}
              />
              <AvatarFallback className="bg-muted text-[10px] md:text-xs">
                {account.fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-medium text-foreground text-xs md:text-sm">
                  {account.fullName}
                </p>
                {account.isActive && !isAccountExpired ? (
                  <Icon
                    className="flex-shrink-0 text-green-600 dark:text-green-400"
                    icon={TickDouble01Icon}
                    size={12}
                  />
                ) : (
                  <Icon
                    className="flex-shrink-0 text-muted-foreground"
                    icon={ClockIcon}
                    size={12}
                  />
                )}
              </div>
              <p className="truncate text-[11px] text-muted-foreground md:text-xs">
                {account.username}
              </p>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="text-right">
              {isAccountExpired ? (
                <Badge
                  className="px-1.5 py-0 text-[10px] md:px-2 md:py-0.5 md:text-xs"
                  variant="destructive"
                >
                  Expired
                </Badge>
              ) : isAccountExpiringSoon ? (
                <Badge className="bg-yellow-100 px-1.5 py-0 text-[10px] text-yellow-800 hover:bg-yellow-200 md:px-2 md:py-0.5 md:text-xs">
                  Expiring
                </Badge>
              ) : account.isActive ? (
                <Badge className="bg-green-100 px-1.5 py-0 text-[10px] text-green-800 hover:bg-green-200 md:px-2 md:py-0.5 md:text-xs">
                  Active
                </Badge>
              ) : (
                <Badge
                  className="px-1.5 py-0 text-[10px] md:px-2 md:py-0.5 md:text-xs"
                  variant="secondary"
                >
                  Inactive
                </Badge>
              )}
              <p className="mt-0.5 hidden text-muted-foreground text-xs md:block">
                {formatTimeAgo(account.lastSyncedAt ?? account.updatedAt)}
              </p>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-7 w-7 text-muted-foreground md:h-8 md:w-8 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
                  size="icon"
                  variant="ghost"
                >
                  <Icon icon={MoreHorizontalIcon} size={14} />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <ReconnectMenuItem socialType={account.socialType} />
                {isInOrg ? (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                      try {
                        await transferMutation({
                          id: account._id,
                          targetOrganizationId: undefined,
                        });
                        toast.success("Moved to personal workspace");
                      } catch {
                        toast.error("Failed to move account");
                      }
                    }}
                  >
                    <Icon className="mr-2" icon={UserIcon} size={16} />
                    Move to Personal
                  </DropdownMenuItem>
                ) : orgs && orgs.length > 0 ? (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                      <Icon
                        className="mr-2"
                        icon={ArrowRight01Icon}
                        size={16}
                      />
                      Move to Organization
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {orgs.map((org) => (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          key={org._id}
                          onClick={async () => {
                            try {
                              await transferMutation({
                                id: account._id,
                                targetOrganizationId: org.clerkOrgId,
                              });
                              toast.success(`Moved to ${org.name}`);
                            } catch {
                              toast.error("Failed to move account");
                            }
                          }}
                        >
                          {org.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ) : null}
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
