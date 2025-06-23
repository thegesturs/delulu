'use client';

import { useUser } from '@delulu/auth/client';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@delulu/design-system/components/ui/dropdown-menu';
import {
  ChevronDownIcon,
  LayoutGridIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function OrganizationSwitcher() {
  const { user } = useUser();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const workspaceName = user.name || 'Personal Workspace';
  const workspaceImage = user.image;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="group h-auto w-full justify-start gap-2 p-2 hover:bg-sidebar-accent group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-0"
        >
          {workspaceImage ? (
            <Image
              src={workspaceImage}
              alt={workspaceName}
              width={32}
              height={32}
              className="rounded-md shadow-bevel"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent shadow-bevel">
              <UserIcon className="h-4 w-4 text-sidebar-foreground" />
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
          <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 group-data-[state=collapsed]:hidden group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="p-2 md:w-[300px]">
        {/* Current Workspace/User Info */}
        <div className="flex items-center gap-3 p-2">
          {workspaceImage ? (
            <Image
              src={workspaceImage}
              alt={workspaceName}
              width={40}
              height={40}
              className="rounded-md"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-accent">
              <UserIcon className="h-5 w-5 text-sidebar-foreground" />
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
            variant="outline"
            size="sm"
            className="flex h-auto w-full justify-start gap-2 p-2 text-sm hover:bg-sidebar-accent"
            onClick={() => router.push('/')}
          >
            <LayoutGridIcon className="h-4 w-4 text-sidebar-foreground/80" />
            Overview
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex h-auto w-full justify-start gap-2 p-2 text-sm hover:bg-sidebar-accent"
            onClick={() => router.push('/settings')}
          >
            <SettingsIcon className="h-4 w-4 text-sidebar-foreground/80" />
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
