'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@delulu/design-system/components/ui/dropdown-menu';
import type { SocialTypes } from '@delulu/validators/post';
import { Linkedin, Plus, Twitter } from 'lucide-react';

interface ConnectedAccountsHeaderProps {
  onConnect: (platform: keyof typeof SocialTypes) => void;
}

export function ConnectedAccountsHeader({
  onConnect,
}: ConnectedAccountsHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Connected Accounts
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your social media connections and sync settings
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Connect Account
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => onConnect('TWITTER')}
              className="cursor-pointer"
            >
              <Twitter className="mr-2 h-4 w-4 text-sky-500" />
              Twitter
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onConnect('LINKEDIN')}
              className="cursor-pointer"
            >
              <Linkedin className="mr-2 h-4 w-4 text-sky-700" />
              LinkedIn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
