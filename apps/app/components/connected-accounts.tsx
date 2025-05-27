'use client';
import { api, useTRPC } from '@/trpc/react';
import type { SocialProvider } from '@delulu/database/prisma/types/zod';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@delulu/design-system/components/ui/avatar';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import { Card, CardContent } from '@delulu/design-system/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@delulu/design-system/components/ui/dropdown-menu';
import { Input } from '@delulu/design-system/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@delulu/design-system/components/ui/select';
import type { SocialTypes } from '@delulu/validators/post';
import { useQuery } from '@tanstack/react-query';
import type { TRPCError } from '@trpc/server';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Grid3X3,
  Instagram,
  Linkedin,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Twitter,
  Youtube,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const socialIcons = {
  TWITTER: Twitter,
  INSTAGRAM: Instagram,
  LINKEDIN: Linkedin,
  YOUTUBE: Youtube,
};

const socialColors = {
  TWITTER: 'bg-[#1DA1F2]',
  INSTAGRAM: 'bg-gradient-to-r from-[#E4405F] to-[#FCAF45]',
  LINKEDIN: 'bg-[#0077B5]',
  YOUTUBE: 'bg-[#FF0000]',
};

const socialLabels = {
  TWITTER: 'Twitter',
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  YOUTUBE: 'YouTube',
};

function formatTimeAgo(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

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
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Fetch connected accounts
  const { data: accounts, isLoading: isLoadingAccounts } =
    api.socialProvider.getConnectedAccounts.useQuery();

  // Connect new account mutation
  const { mutate: connectAccount, isLoading: isConnecting } =
    trpc.socialProvider.getSocialProviderConnectUrl.useMutation({
      onSuccess: (url: string) => {
        window.location.href = url;
      },
      onError: (error: TRPCError) => {
        toast.error('Failed to connect account', {
          description: error.message,
        });
      },
    });

  const userQuery = useQuery(
    trpc.socialProvider.getSocialProviderConnectUrl.queryOptions({
      provider: 'TWITTER',
    })
  );

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];

    return accounts.filter((account: SocialProvider) => {
      const matchesSearch =
        account.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.username?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlatform =
        filterPlatform === 'all' || account.socialType === filterPlatform;

      const isAccountExpired = account.expiresIn
        ? isExpired(account.expiresIn)
        : false;
      const isAccountExpiringSoon = account.expiresIn
        ? isExpiringSoon(account.expiresIn)
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
    connectAccount({ provider: platform });
  };

  const AccountCard = ({ account }: { account: SocialProvider }) => {
    const SocialIcon =
      socialIcons[account.socialType as keyof typeof socialIcons];
    const isAccountExpired = account.expiresIn
      ? isExpired(account.expiresIn)
      : false;
    const isAccountExpiringSoon = account.expiresIn
      ? isExpiringSoon(account.expiresIn)
      : false;

    return (
      <Card className="group hover:-translate-y-0.5 border-0 bg-white/50 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Social Platform Icon */}
            <div className="relative">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  socialColors[account.socialType as keyof typeof socialColors]
                } shadow-sm`}
              >
                <SocialIcon className="h-5 w-5 text-white" />
              </div>
              {isAccountExpired && (
                <div className="-top-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                  <AlertTriangle className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                <AvatarImage
                  src={account.profileImage || '/placeholder.svg'}
                  alt={account.fullName || ''}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-50 to-indigo-100 text-xs">
                  {account.fullName
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('') || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-gray-900 text-sm">
                    {account.fullName}
                  </p>
                  {account.isActive && !isAccountExpired ? (
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  )}
                </div>
                <p className="truncate text-gray-500 text-xs">
                  {account.username}
                </p>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                {isAccountExpired ? (
                  <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                    Expired
                  </Badge>
                ) : isAccountExpiringSoon ? (
                  <Badge className="bg-amber-100 px-2 py-0.5 text-amber-800 text-xs hover:bg-amber-100">
                    Expires soon
                  </Badge>
                ) : account.isActive ? (
                  <Badge className="bg-emerald-100 px-2 py-0.5 text-emerald-800 text-xs hover:bg-emerald-100">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                    Inactive
                  </Badge>
                )}
                <p className="mt-1 text-gray-400 text-xs">
                  {formatTimeAgo(account.lastSyncedAt)}
                </p>
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 opacity-0 transition-opacity hover:text-gray-600 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleConnect(account.socialType)}
                    className="cursor-pointer"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reconnect
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoadingAccounts) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          <span className="text-gray-600">Loading accounts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl text-gray-900 tracking-tight">
                Connected Accounts
              </h1>
              <p className="mt-1 text-gray-600">
                Manage your social media connections and sync settings
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:from-blue-700 hover:to-indigo-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => handleConnect('TWITTER')}
                  className="cursor-pointer"
                >
                  <Twitter className="mr-2 h-4 w-4 text-[#1DA1F2]" />
                  Twitter
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleConnect('LINKEDIN')}
                  className="cursor-pointer"
                >
                  <Linkedin className="mr-2 h-4 w-4 text-[#0077B5]" />
                  LinkedIn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-white/20 bg-white/60 p-4 backdrop-blur-sm">
              <div className="font-bold text-2xl text-gray-900">
                {stats.total}
              </div>
              <div className="text-gray-600 text-sm">Total Accounts</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/60 p-4 backdrop-blur-sm">
              <div className="font-bold text-2xl text-emerald-600">
                {stats.active}
              </div>
              <div className="text-gray-600 text-sm">Active</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/60 p-4 backdrop-blur-sm">
              <div className="font-bold text-2xl text-amber-600">
                {stats.expiring}
              </div>
              <div className="text-gray-600 text-sm">Expiring Soon</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/60 p-4 backdrop-blur-sm">
              <div className="font-bold text-2xl text-red-600">
                {stats.expired}
              </div>
              <div className="text-gray-600 text-sm">Expired</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-white/20 bg-white/60 p-4 backdrop-blur-sm">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative max-w-sm flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
                <Input
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-white/20 bg-white/80 pl-10"
                />
              </div>

              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-full border-white/20 bg-white/80 sm:w-40">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="TWITTER">Twitter</SelectItem>
                  <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full border-white/20 bg-white/80 sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="expiring">Expiring</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-9 w-9 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-9 w-9 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Accounts Grid/List */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-3'
          }
        >
          {filteredAccounts.map((account: SocialProvider) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>

        {filteredAccounts.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mb-2 text-gray-500 text-lg">No accounts found</p>
            <p className="text-gray-400 text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
