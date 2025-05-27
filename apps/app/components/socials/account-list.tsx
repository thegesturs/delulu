'use client';

import type { SocialProvider } from '@delulu/database/prisma/types/zod';
import type { SocialTypes } from '@delulu/validators/post';
import { Search } from 'lucide-react';
import { AccountCard } from './account-card'; // Assuming AccountCard is in the same directory

interface AccountListProps {
  accounts: SocialProvider[];
  viewMode: 'grid' | 'list';
  onConnect: (platform: keyof typeof SocialTypes) => void;
}

export function AccountList({
  accounts,
  viewMode,
  onConnect,
}: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="mb-2 text-lg text-muted-foreground">No accounts found</p>
        <p className="text-muted-foreground text-sm">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
          : 'space-y-3'
      }
    >
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} onConnect={onConnect} />
      ))}
    </div>
  );
}
