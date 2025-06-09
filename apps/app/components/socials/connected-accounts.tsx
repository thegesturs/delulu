'use client';

import { api } from '@/trpc/react';
import type { SocialProvider } from '@delulu/database/prisma/types/zod';
import type { SocialTypes } from '@delulu/validators/post';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AccountFilters } from './account-filter';
import { AccountList } from './account-list';
import { AccountStats } from './account-stats';
import { ConnectedAccountsHeader } from './connect-account-header';

// Helper functions (isExpiringSoon, isExpired) should be co-located or imported if used elsewhere
// For this refactor, assuming they are only used by logic within this main component or passed down
function isExpiringSoon(expiresIn: Date): boolean {
  const now = new Date();
  const diffInDays = Math.floor(
    (expiresIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffInDays <= 7 && diffInDays > 0;
}

function isExpired(expiresIn: Date): boolean {
  return new Date() > expiresIn;
}

export default function ConnectedAccounts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const { data: accounts, isLoading: isLoadingAccounts } =
    api.socialProvider.getConnectedAccounts.useQuery();

  const { mutate: connectAccount } =
    api.socialProvider.getSocialProviderConnectUrl.useMutation({
      onSuccess: (url: string) => {
        window.location.href = url;
      },
    });

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];

    return accounts.filter((account: SocialProvider) => {
      const matchesSearch =
        account.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.username?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlatform =
        filterPlatform === 'all' || account.socialType === filterPlatform;

      const isAccountExpired = account.refreshTokenExpiresIn
        ? isExpired(account.refreshTokenExpiresIn)
        : false;
      const isAccountExpiringSoon = account.refreshTokenExpiresIn
        ? isExpiringSoon(account.refreshTokenExpiresIn)
        : false;

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && account.isActive && !isAccountExpired) ||
        (filterStatus === 'expired' && isAccountExpired) ||
        (filterStatus === 'expiring' && isAccountExpiringSoon) ||
        (filterStatus === 'inactive' && !account.isActive);

      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [accounts, searchQuery, filterPlatform, filterStatus]);

  const stats = useMemo(() => {
    if (!accounts) return { active: 0, expired: 0, expiring: 0, total: 0 };

    const active = accounts.filter(
      (a: SocialProvider) => a.isActive && !isExpired(a.expiresIn ?? new Date())
    ).length;
    const expired = accounts.filter((a: SocialProvider) =>
      isExpired(a.expiresIn ?? new Date())
    ).length;
    const expiring = accounts.filter((a: SocialProvider) =>
      isExpiringSoon(a.expiresIn ?? new Date())
    ).length;
    return { active, expired, expiring, total: accounts.length };
  }, [accounts]);

  const handleConnect = (platform: keyof typeof SocialTypes) => {
    // Removed Instagram and YouTube as they were not handled by connectAccount
    if (
      platform === 'TWITTER' ||
      platform === 'LINKEDIN' ||
      platform === 'TIKTOK'
    ) {
      connectAccount({ provider: platform });
    }
  };

  if (isLoadingAccounts) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading accounts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <ConnectedAccountsHeader onConnect={handleConnect} />
        <AccountStats stats={stats} />
        <AccountFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterPlatform={filterPlatform}
          setFilterPlatform={setFilterPlatform}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        <AccountList
          accounts={filteredAccounts}
          viewMode={viewMode}
          onConnect={handleConnect} // Pass handleConnect to AccountList for reconnect functionality in AccountCard
        />
      </div>
    </div>
  );
}
