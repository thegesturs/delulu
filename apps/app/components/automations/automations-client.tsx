'use client';

import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { Icon } from '@delulu/design-system/providers/icon';
import { useQuery } from 'convex-helpers/react/cache';
import { useMutation } from 'convex/react';
import { Loading03Icon } from '@hugeicons-pro/core-solid-rounded';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AutomationsHeader } from './automations-header';
import { AutomationStats } from './automation-stats';
import { AutomationFilters } from './automation-filters';
import { AutomationList } from './automation-list';
import { CreateAutomationDialog } from './create-automation-dialog';

export default function AutomationsClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTrigger, setFilterTrigger] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const automations = useQuery(api.automations.getAutomations, {});
  const socialProviders = useQuery(api.social_providers.getConnectedAccounts);
  const isLoading = automations === undefined;

  const deleteAutomationMutation = useMutation(api.automations.deleteAutomation);
  const toggleAutomationMutation = useMutation(api.automations.toggleAutomation);

  // Filter to only Instagram providers
  const instagramProviders = useMemo(() => {
    if (!socialProviders) return [];
    return socialProviders.filter((p) => p.socialType === 'INSTAGRAM');
  }, [socialProviders]);

  const filteredAutomations = useMemo(() => {
    if (!automations) return [];

    return automations.filter((automation) => {
      const matchesSearch =
        automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        automation.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && automation.isActive) ||
        (filterStatus === 'inactive' && !automation.isActive);

      const matchesTrigger =
        filterTrigger === 'all' || automation.triggerType === filterTrigger;

      return matchesSearch && matchesStatus && matchesTrigger;
    });
  }, [automations, searchQuery, filterStatus, filterTrigger]);

  const stats = useMemo(() => {
    if (!automations) {
      return { total: 0, active: 0, inactive: 0, totalDMsSent: 0 };
    }

    const active = automations.filter((a) => a.isActive).length;
    const totalDMsSent = automations.reduce((acc, a) => acc + a.totalDMsSent, 0);

    return {
      total: automations.length,
      active,
      inactive: automations.length - active,
      totalDMsSent,
    };
  }, [automations]);

  const handleDelete = async (automationId: Id<'automations'>) => {
    try {
      await deleteAutomationMutation({ id: automationId });
      toast.success('Automation deleted successfully');
    } catch (error) {
      toast.error('Failed to delete automation');
      console.error(error);
    }
  };

  const handleToggle = async (automationId: Id<'automations'>) => {
    try {
      const newState = await toggleAutomationMutation({ id: automationId });
      toast.success(newState ? 'Automation enabled' : 'Automation disabled');
    } catch (error) {
      toast.error('Failed to toggle automation');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Icon
            icon={Loading03Icon}
            size={20}
            className="animate-spin text-muted-foreground"
          />
          <span className="text-muted-foreground">Loading automations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col space-y-6 p-6">
        <AutomationsHeader onCreateClick={() => setCreateDialogOpen(true)} />
        <AutomationStats stats={stats} />
        <AutomationFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterTrigger={filterTrigger}
          setFilterTrigger={setFilterTrigger}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        <AutomationList
          automations={filteredAutomations}
          viewMode={viewMode}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
        <CreateAutomationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          instagramProviders={instagramProviders}
        />
      </div>
    </div>
  );
}
