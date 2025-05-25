'use client';

import {
  useOrganization,
  useOrganizationList,
  useUser,
} from '@delulu/auth/client';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@delulu/design-system/components/ui/dropdown-menu';
import {
  Building2Icon,
  CheckIcon,
  ChevronDownIcon,
  LayoutGridIcon,
  LogOutIcon,
  PlusIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function OrganizationSwitcher() {
  const { organization } = useOrganization();
  const { userMemberships, setActive } = useOrganizationList();
  const { user } = useUser();
  const router = useRouter();

  if (!userMemberships) {
    return null;
  }

  const activeWorkspaceName = organization
    ? organization.name
    : user?.fullName || user?.username || 'Personal Workspace';

  const activeWorkspaceImage = organization
    ? organization.imageUrl
    : user?.imageUrl;

  const activeWorkspaceIsPersonal = !organization;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="group h-auto w-full justify-start gap-2 p-2 hover:bg-sidebar-accent"
        >
          {activeWorkspaceImage ? (
            <Image
              src={activeWorkspaceImage}
              alt={activeWorkspaceName}
              width={32}
              height={32}
              className="rounded-md shadow-bevel"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent shadow-bevel">
              {activeWorkspaceIsPersonal ? (
                <UserIcon className="h-4 w-4 text-sidebar-foreground" />
              ) : (
                <Building2Icon className="h-4 w-4 text-sidebar-foreground" />
              )}
            </div>
          )}
          <div className="flex flex-1 flex-col items-start overflow-hidden">
            <span className="truncate font-medium text-sm">
              {activeWorkspaceName}
            </span>
            {activeWorkspaceIsPersonal && (
              <span className="text-sidebar-foreground/60 text-xs">
                Personal Workspace
              </span>
            )}
          </div>
          <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="p-2 md:w-[400px]">
        {/* Current Workspace/User Info */}
        <div className="flex items-center gap-3 p-2">
          {activeWorkspaceImage ? (
            <Image
              src={activeWorkspaceImage}
              alt={activeWorkspaceName}
              width={40}
              height={40}
              className="rounded-md"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-accent">
              {activeWorkspaceIsPersonal ? (
                <UserIcon className="h-5 w-5 text-sidebar-foreground" />
              ) : (
                <Building2Icon className="h-5 w-5 text-sidebar-foreground" />
              )}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{activeWorkspaceName}</span>
            {!activeWorkspaceIsPersonal && organization?.name && (
              <span className="text-sidebar-foreground/60 text-xs">
                Free {/* Assuming 'Free' or plan type, adjust as needed */}
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 p-2">
          <Button
            variant="outline"
            size="sm"
            className="flex h-auto w-full justify-start gap-2 p-2 text-sm hover:bg-sidebar-accent"
            onClick={() =>
              router.push(organization ? `/${organization.slug}` : '/')
            }
          >
            <LayoutGridIcon className="h-4 w-4 text-sidebar-foreground/80" />
            Overview
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex h-auto w-full justify-start gap-2 p-2 text-sm hover:bg-sidebar-accent"
            onClick={() =>
              router.push(
                organization
                  ? `/organizations/${organization.slug}/settings`
                  : '/user/settings' // Adjust personal settings path
              )
            }
          >
            <SettingsIcon className="h-4 w-4 text-sidebar-foreground/80" />
            Settings
          </Button>
        </div>

        <DropdownMenuSeparator className="my-1" />

        {/* Switch Workspace */}
        <DropdownMenuLabel className="px-2 py-1.5 font-semibold text-sidebar-foreground/60 text-xs">
          Switch workspace
        </DropdownMenuLabel>
        {!activeWorkspaceIsPersonal && (
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2 p-2"
            onClick={() => {
              setActive?.({ organization: null });
              router.push('/');
            }}
          >
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={user.fullName || user.username || 'Profile'}
                width={24}
                height={24}
                className="rounded-md"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sidebar-accent">
                <UserIcon className="h-4 w-4 text-sidebar-foreground" />
              </div>
            )}
            <span className="flex-1 truncate text-sm">
              {user?.fullName || user?.username || 'Personal Account'}
            </span>
            {activeWorkspaceIsPersonal && (
              <CheckIcon className="h-4 w-4 text-sidebar-primary" />
            )}
          </DropdownMenuItem>
        )}
        {userMemberships.data
          ?.filter(({ organization: org }) => org.id !== organization?.id)
          .map(({ organization: org }) => (
            <DropdownMenuItem
              key={org.id}
              className="flex cursor-pointer items-center gap-2 p-2"
              onClick={() => {
                setActive?.({ organization: org.id });
                router.push(`/${org.slug}`);
              }}
            >
              {org.imageUrl ? (
                <Image
                  src={org.imageUrl}
                  alt={org.name}
                  width={24}
                  height={24}
                  className="rounded-md"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sidebar-accent">
                  <Building2Icon className="h-4 w-4 text-sidebar-foreground" />
                </div>
              )}
              <span className="flex-1 truncate text-sm">{org.name}</span>
              {org.id === organization?.id && (
                <CheckIcon className="h-4 w-4 text-sidebar-primary" />
              )}
            </DropdownMenuItem>
          ))}
        <DropdownMenuItem
          className="mx-2 flex cursor-pointer items-center gap-2 border bg-background p-2 shadow-xs"
          onClick={() => router.push('/organizations/new')}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sidebar-accent">
            <PlusIcon className="h-4 w-4 text-sidebar-foreground" />
          </div>
          <span className="text-sm">Create Organization</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        {/* Sign Out */}
        <DropdownMenuItem
          className="hover:!text-red-500 hover:!bg-red-500/10 flex cursor-pointer items-center gap-2 p-2 text-red-500"
          onClick={() => {
            // Implement sign out logic here
            // For example, using Clerk:
            // import { useClerk } from '@clerk/nextjs';
            // const { signOut } = useClerk();
            // signOut(() => router.push('/sign-in'));
            console.log('Sign out clicked');
          }}
        >
          <LogOutIcon className="h-4 w-4" />
          <span className="text-sm">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
