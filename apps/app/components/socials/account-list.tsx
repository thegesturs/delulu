'use client';

import type { SocialProvider } from '@/types/convex';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { cn } from '@delulu/design-system/lib/utils';
import { Search } from 'lucide-react';
import { AccountCard } from './account-card'; // Assuming AccountCard is in the same directory

interface AccountListProps {
  accounts: SocialProvider[];
  viewMode: 'grid' | 'list';
  onDelete: (socialId: Id<'socialProviders'>) => void;
}

export function AccountList({
  accounts,
  viewMode,
  onDelete,
}: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <div className="py-6 text-center">
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
      className={cn(
        viewMode === 'grid' &&
          'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
        viewMode === 'list' && 'space-y-3',
        'max-h-[calc(100vh-370px)] space-y-2 overflow-auto py-2'
      )}
    >
      {accounts.map((account) => (
        <AccountCard key={account._id} account={account} onDelete={onDelete} />
      ))}
    </div>
  );
}
