"use client";

import { useUser } from "@delulu/auth";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@delulu/design-system/components/ui/dropdown-menu";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ChevronDown,
  GridViewIcon,
  Settings01Icon,
  UserIcon,
} from "@hugeicons-pro/core-solid-rounded";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function OrganizationSwitcher() {
  const { user } = useUser();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const workspaceName = user.fullName || "Personal Workspace";
  const workspaceImage = user.imageUrl;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="group h-auto w-full justify-start gap-2 p-2 hover:bg-sidebar-accent group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-0"
          variant="ghost"
        >
          {workspaceImage ? (
            <Image
              alt={workspaceName}
              className="rounded-md shadow-bevel"
              height={32}
              src={workspaceImage}
              width={32}
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent shadow-bevel">
              <Icon
                className="text-sidebar-foreground"
                icon={UserIcon}
                size={16}
              />
            </div>
          )}
          <div className="flex flex-1 flex-col items-start overflow-hidden group-data-[state=collapsed]:hidden">
            <span className="truncate font-medium text-sm">
              {workspaceName}
            </span>
            <span className="text-sidebar-foreground/60 text-xs">
              Personal Workspace
            </span>
          </div>
          <Icon
            className="shrink-0 opacity-50 transition-transform duration-200 group-data-[state=collapsed]:hidden group-data-[state=open]:rotate-180"
            icon={ChevronDown}
            size={16}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="p-2 md:w-[300px]">
        {/* Current Workspace/User Info */}
        <div className="flex items-center gap-3 p-2">
          {workspaceImage ? (
            <Image
              alt={workspaceName}
              className="rounded-md"
              height={40}
              src={workspaceImage}
              width={40}
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-accent">
              <Icon
                className="text-sidebar-foreground"
                icon={UserIcon}
                size={20}
              />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{workspaceName}</span>
            <span className="text-sidebar-foreground/60 text-xs">
              Free Plan
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 p-2">
          <Button
            className="flex h-auto w-full justify-start gap-2 p-2 text-sm hover:bg-sidebar-accent"
            onClick={() => router.push("/")}
            size="sm"
            variant="outline"
          >
            <Icon
              className="text-sidebar-foreground/80"
              icon={GridViewIcon}
              size={16}
            />
            Overview
          </Button>
          <Button
            className="flex h-auto w-full justify-start gap-2 p-2 text-sm hover:bg-sidebar-accent"
            onClick={() => router.push("/settings")}
            size="sm"
            variant="outline"
          >
            <Icon
              className="text-sidebar-foreground/80"
              icon={Settings01Icon}
              size={16}
            />
            Settings
          </Button>
        </div>

        <DropdownMenuSeparator className="my-1" />

        {/* Note about organizations */}
        <div className="px-2 py-2 text-center text-muted-foreground text-xs">
          Organizations coming soon
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
