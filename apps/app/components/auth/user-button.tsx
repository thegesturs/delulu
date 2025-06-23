'use client';

import { signOut, useUser } from '@delulu/auth/client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@delulu/design-system/components/ui/avatar';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@delulu/design-system/components/ui/dropdown-menu';
import { LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

type UserButtonProps = {
  showName?: boolean;
  appearance?: {
    elements?: Record<string, string>;
  };
};

export const UserButton = ({
  showName = true,
  appearance,
}: UserButtonProps) => {
  const { user, isLoading } = useUser();
  const router = useRouter();

  if (isLoading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`h-auto p-2 ${appearance?.elements?.rootBox || ''}`}
        >
          <div className="flex items-center gap-2">
            <Avatar
              className={`h-8 w-8 ${appearance?.elements?.avatarBox || ''}`}
            >
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {showName && (
              <span
                className={`truncate text-sm ${appearance?.elements?.userButtonOuterIdentifier || ''}`}
              >
                {user.name}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{user.name}</span>
            <span className="text-muted-foreground text-xs">{user.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
