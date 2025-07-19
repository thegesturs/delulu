'use client';

import { api } from '@delulu/database/convex/_generated/api';
import {api as TrpcApi} from '@/trpc/react'
import { useQuery, useMutation } from 'convex/react';
import type { SocialProvider, SocialType } from '@/types/convex';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AccountFilters } from './account-filter';
import { AccountList } from './account-list';
import { AccountStats } from './account-stats';
import { ConnectedAccountsHeader } from './connect-account-header';
import type { Id } from '@delulu/database/convex/_generated/dataModel';

// Helper functions (isExpiringSoon, isExpired) should be co-located or imported if used elsewhere
// For this refactor, assuming they are only used by logic within this main component or passed down
function isExpiringSoon(expiresIn: number | undefined): boolean {
  if (!expiresIn) return false;
  const now = Date.now();
  const diffInDays = Math.floor(
    (expiresIn - now) / (1000 * 60 * 60 * 24)
  );
  return diffInDays <= 7 && diffInDays > 0;
}

function isExpired(expiresIn: number | undefined): boolean {
  if (!expiresIn) return false;
  return Date.now() > expiresIn;
}

export default function ConnectedAccounts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const accounts = useQuery(api.social_providers.getConnectedAccounts);
  const isLoadingAccounts = accounts === undefined;

  const deleteSocial = useMutation(api.social_providers.deleteSocial);
  const {mutateAsync: connectAccount} = TrpcApi.socialProvider.getSocialProviderConnectUrl.useMutation({
    onSuccess: (data) => {
      window.location.href = data;
    },
    onError: (error) => {
      toast.error('Failed to get connect URL');
      console.error(error);
    },
  })

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];

    return accounts.filter((account: SocialProvider) => {
      const matchesSearch =
        account.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.username?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlatform =
        filterPlatform === 'all' || account.socialType === filterPlatform;

      const isAccountExpired = isExpired(account.refreshTokenExpiresIn);
      const isAccountExpiringSoon = isExpiringSoon(account.refreshTokenExpiresIn);

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
    if (!accounts) {
      return { active: 0, expired: 0, expiring: 0, total: 0 };
    }

    const active = accounts.filter(
      (a: SocialProvider) => a.isActive && !isExpired(a.refreshTokenExpiresIn)
    ).length;
    const expired = accounts.filter((a: SocialProvider) =>
      isExpired(a.refreshTokenExpiresIn)
    ).length;
    const expiring = accounts.filter((a: SocialProvider) =>
      isExpiringSoon(a.refreshTokenExpiresIn)
    ).length;
    return { active, expired, expiring, total: accounts.length };
  }, [accounts]);

  const handleConnect = (platform: SocialType) => {
    // Removed Instagram and YouTube as they were not handled by connectAccount
    if (platform !== 'LENS') {
      connectAccount({ provider: platform })
        .then((url: string) => {
          window.location.href = url;
        })
        .catch((error) => {
          toast.error('Failed to get connect URL');
          console.error(error);
        });
    }
  };

  const handleDeleteSocial = (socialId: Id<'socialProviders'>) => {
    deleteSocial({ socialId })
      .then(() => {
        toast.success('Account deleted successfully');
      })
      .catch((error) => {
        toast.error('Failed to delete account');
        console.error(error);
      });
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
          onConnect={handleConnect}
          onDelete={handleDeleteSocial}
        />
      </div>
    </div>
  );
}
