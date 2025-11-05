'use client';

/**
 * Usage Stats Component
 *
 * Displays current usage against plan limits with visual progress bars
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@delulu/design-system/components/ui/card';
import { Progress } from '@delulu/design-system/components/ui/progress';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Button } from '@delulu/design-system/components/ui/button';
import { useQuery } from 'convex/react';
import { AlertCircle, BarChart3, Image, Users, Zap } from 'lucide-react';
import { api } from '@delulu/database/convex/_generated/api';
import { useSubscription } from '@/hooks/use-subscription';
import { useUsageLimit } from '@/hooks/use-usage-limits';

interface UsageStatItemProps {
  icon: React.ReactNode;
  label: string;
  current: number;
  limit: number;
  isUnlimited: boolean;
  percentageUsed: number;
}

function UsageStatItem({
  icon,
  label,
  current,
  limit,
  isUnlimited,
  percentageUsed,
}: UsageStatItemProps) {
  const isNearLimit = percentageUsed >= 80 && !isUnlimited;
  const isAtLimit = percentageUsed >= 100 && !isUnlimited;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {isAtLimit && <AlertCircle className="h-4 w-4 text-destructive" />}
          <span className="text-sm font-mono">
            {isUnlimited ? (
              <>
                {current} <span className="text-muted-foreground">/ Unlimited</span>
              </>
            ) : (
              <>
                {current} <span className="text-muted-foreground">/ {limit}</span>
              </>
            )}
          </span>
        </div>
      </div>
      {!isUnlimited && (
        <div className="space-y-1">
          <Progress
            value={percentageUsed}
            className={`h-2 ${
              isAtLimit
                ? '[&>div]:bg-destructive'
                : isNearLimit
                  ? '[&>div]:bg-yellow-500'
                  : ''
            }`}
          />
          {isNearLimit && (
            <p className="text-xs text-muted-foreground">
              {isAtLimit
                ? 'Limit reached - Upgrade to continue'
                : 'Approaching limit - Consider upgrading'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function UsageStats() {
  const subscription = useSubscription();

  // Fetch actual usage from queries
  const socialProviders = useQuery(api.social_providers.getConnectedAccounts);
  const user = useQuery(api.users.current);

  // Calculate usage for each limit type
  const socialAccountsCount = socialProviders?.length || 0;
  const monthlyPostsCount = user?.usage?.generatedPosts || 0; // You might want a more accurate count
  const draftsCount = user?.usage?.drafts || 0;

  // Get limit checks
  const socialAccountsLimit = useUsageLimit('socialAccounts', socialAccountsCount);
  const monthlyPostsLimit = useUsageLimit('monthlyPosts', monthlyPostsCount);
  // Media storage would need actual calculation
  const teamMembersLimit = useUsageLimit('teamMembers', 1); // Update with actual team size

  if (subscription.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>Loading usage statistics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasAnyLimitReached =
    (!socialAccountsLimit.isUnlimited && socialAccountsLimit.percentageUsed >= 100) ||
    (!monthlyPostsLimit.isUnlimited && monthlyPostsLimit.percentageUsed >= 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Usage & Limits</CardTitle>
            <CardDescription>
              Track your usage against your {subscription.planType} plan limits
            </CardDescription>
          </div>
          {subscription.isPaid && (
            <Badge variant="secondary">
              <BarChart3 className="h-3 w-3 mr-1" />
              {subscription.planType}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Social Accounts */}
        <UsageStatItem
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
          label="Social Accounts"
          current={socialAccountsCount}
          limit={socialAccountsLimit.limit}
          isUnlimited={socialAccountsLimit.isUnlimited}
          percentageUsed={socialAccountsLimit.percentageUsed}
        />

        {/* Monthly Posts */}
        <UsageStatItem
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          label="Posts This Month"
          current={monthlyPostsCount}
          limit={monthlyPostsLimit.limit}
          isUnlimited={monthlyPostsLimit.isUnlimited}
          percentageUsed={monthlyPostsLimit.percentageUsed}
        />

        {/* Media Storage */}
        <UsageStatItem
          icon={<Image className="h-4 w-4 text-muted-foreground" />}
          label="Media Storage"
          current={0} // TODO: Calculate actual storage usage
          limit={100} // Placeholder
          isUnlimited={subscription.isEnterprise}
          percentageUsed={0}
        />

        {/* Team Members */}
        <UsageStatItem
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          label="Team Members"
          current={1}
          limit={teamMembersLimit.limit}
          isUnlimited={teamMembersLimit.isUnlimited}
          percentageUsed={teamMembersLimit.percentageUsed}
        />

        {/* Upgrade prompt */}
        {hasAnyLimitReached && subscription.isFree && (
          <div className="rounded-lg bg-primary/10 p-4 space-y-3">
            <p className="text-sm font-medium">You've reached your plan limit</p>
            <p className="text-sm text-muted-foreground">
              Upgrade to continue adding accounts and creating posts without interruption.
            </p>
            <Button className="w-full" onClick={() => window.location.href = '/billing'}>
              View Upgrade Options
            </Button>
          </div>
        )}

        {/* Plan upgrade suggestion for near-limits */}
        {!hasAnyLimitReached &&
          !subscription.isEnterprise &&
          (socialAccountsLimit.percentageUsed >= 80 ||
            monthlyPostsLimit.percentageUsed >= 80) && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Approaching your plan limits
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Consider upgrading to avoid interruptions.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => window.location.href = '/billing'}
              >
                View Plans
              </Button>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact usage stats for dashboards
 */
export function CompactUsageStats() {
  const socialProviders = useQuery(api.social_providers.getConnectedAccounts);
  const user = useQuery(api.users.current);
  const subscription = useSubscription();

  const socialAccountsCount = socialProviders?.length || 0;
  const monthlyPostsCount = user?.usage?.generatedPosts || 0;

  const socialAccountsLimit = useUsageLimit('socialAccounts', socialAccountsCount);
  const monthlyPostsLimit = useUsageLimit('monthlyPosts', monthlyPostsCount);

  if (subscription.isLoading) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Social Accounts</span>
            <span className="text-sm font-mono">
              {socialAccountsCount}/{' '}
              {socialAccountsLimit.isUnlimited ? '∞' : socialAccountsLimit.limit}
            </span>
          </div>
          {!socialAccountsLimit.isUnlimited && (
            <Progress value={socialAccountsLimit.percentageUsed} className="h-2" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Posts This Month</span>
            <span className="text-sm font-mono">
              {monthlyPostsCount}/{' '}
              {monthlyPostsLimit.isUnlimited ? '∞' : monthlyPostsLimit.limit}
            </span>
          </div>
          {!monthlyPostsLimit.isUnlimited && (
            <Progress value={monthlyPostsLimit.percentageUsed} className="h-2" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
