'use client';

import { signOut, useUser } from '../client';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@delulu/design-system/components/ui/dropdown-menu';
import { LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type UserButtonProps = {
  showName?: boolean;
  appearance?: {
    elements?: Record<string, string>;
  };
};

export const UserButton = ({ showName = true, appearance }: UserButtonProps) => {
  const { user, isLoading } = useUser();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`h-auto p-2 ${appearance?.elements?.rootBox || ''}`}
        >
          <div className="flex items-center gap-2">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={32}
                height={32}
                className={`rounded-full ${appearance?.elements?.avatarBox || ''}`}
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                <UserIcon className="h-4 w-4 text-gray-600" />
              </div>
            )}
            {showName && (
              <span className={`truncate text-sm ${appearance?.elements?.userButtonOuterIdentifier || ''}`}>
                {user.name}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 p-2">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
              <UserIcon className="h-5 w-5 text-gray-600" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium text-sm">{user.name}</span>
            <span className="text-gray-500 text-xs">{user.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <SettingsIcon className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOutIcon className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};