"use client";

import {
  AUTOMATION_DELETED,
  AUTOMATION_TOGGLED,
} from "@delulu/analytics/events";
import { useAnalytics } from "@delulu/analytics/posthog/client";
import type { AutomationScope } from "@delulu/client";
import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import { Loading03Icon } from "@hugeicons-pro/core-solid-rounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/components/providers/api-client";
import { usePermissions } from "@/hooks/use-permissions";
import { AutomationFilters } from "./automation-filters";
import { AutomationList } from "./automation-list";
import {
  automationFromResource,
  getApiErrorDetails,
  useAutomationWorkspace,
} from "./automation-resource";
import { AutomationStats } from "./automation-stats";
import { AutomationsHeader } from "./automations-header";
import { TemplatePickerDialog } from "./flow-builder/templates/template-picker-dialog";

function RequestError({ error, retry }: { error: unknown; retry: () => void }) {
  const details = getApiErrorDetails(error);
  const title =
    details.kind === "permission"
      ? "You do not have permission to view automations"
      : details.kind === "transport"
        ? "Automations could not be reached"
        : "Automations could not be loaded";
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <div>
        <h2 className="font-semibold text-lg">{title}</h2>
        <p className="mt-1 max-w-md text-muted-foreground text-sm">
          {details.message}
        </p>
      </div>
      {details.kind === "permission" ? null : (
        <Button onClick={retry} variant="outline">
          Try again
        </Button>
      )}
    </div>
  );
}

function AutomationsResourceClient({ scope }: { scope: AutomationScope }) {
  const router = useRouter();
  const analytics = useAnalytics();
  const queryClient = useQueryClient();
  const { resources } = useApiClient();
  const { canManageSocials } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTrigger, setFilterTrigger] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const pendingIds = useRef(new Set<string>());

  const listOptions = useMemo(
    () => resources.automations.list(scope),
    [resources, scope]
  );
  const automationsQuery = useQuery({
    ...listOptions,
    queryKey: listOptions.queryKey!,
  });
  const automations = useMemo(
    () => (automationsQuery.data?.data ?? []).map(automationFromResource),
    [automationsQuery.data]
  );

  const deleteMutation = useMutation({
    ...resources.automations.remove(scope),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listOptions.queryKey! });
      const previous = queryClient.getQueryData(listOptions.queryKey!);
      queryClient.setQueryData(
        listOptions.queryKey!,
        (page: typeof automationsQuery.data) =>
          page
            ? {
                ...page,
                data: page.data.filter((automation) => automation.id !== id),
                total: Math.max(0, page.total - 1),
              }
            : page
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listOptions.queryKey!, context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: listOptions.queryKey! }),
  });

  const toggleMutation = useMutation({
    mutationKey: listOptions.queryKey!,
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => {
      const mutation = resources.automations.update(scope, id).mutationFn;
      if (!mutation) {
        throw new Error("Automation update is unavailable");
      }
      return mutation({ enabled });
    },
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: listOptions.queryKey! });
      const previous = queryClient.getQueryData(listOptions.queryKey!);
      queryClient.setQueryData(
        listOptions.queryKey!,
        (page: typeof automationsQuery.data) =>
          page
            ? {
                ...page,
                data: page.data.map((automation) =>
                  automation.id === id ? { ...automation, enabled } : automation
                ),
              }
            : page
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listOptions.queryKey!, context.previous);
      }
    },
    onSettled: (_data, _error, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: listOptions.queryKey! }),
        queryClient.invalidateQueries({
          queryKey: resources.automations.get(scope, variables.id).queryKey,
        }),
      ]),
  });

  const filteredAutomations = useMemo(
    () =>
      automations.filter((automation) => {
        const matchesSearch =
          automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          automation.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && automation.enabled) ||
          (filterStatus === "inactive" && !automation.enabled);
        const matchesTrigger =
          filterTrigger === "all" ||
          automation.triggers.some(
            (trigger) => trigger.triggerType === filterTrigger
          );
        return matchesSearch && matchesStatus && matchesTrigger;
      }),
    [automations, filterStatus, filterTrigger, searchQuery]
  );

  const stats = useMemo(() => {
    const active = automations.filter(
      (automation) => automation.enabled
    ).length;
    return {
      total: automations.length,
      active,
      inactive: automations.length - active,
      totalDMsSent: automations.reduce(
        (total, automation) => total + automation.totalDmsSent,
        0
      ),
    };
  }, [automations]);

  const handleDelete = async (automationId: string) => {
    if (!canManageSocials || pendingIds.current.has(automationId)) {
      return;
    }
    pendingIds.current.add(automationId);
    try {
      await deleteMutation.mutateAsync(automationId);
      analytics.capture(AUTOMATION_DELETED, { automation_id: automationId });
      toast.success("Automation deleted successfully");
    } catch (error) {
      const details = getApiErrorDetails(error);
      toast.error(
        details.kind === "permission"
          ? "You do not have permission to delete automations"
          : details.message
      );
    } finally {
      pendingIds.current.delete(automationId);
    }
  };

  const handleToggle = async (automationId: string) => {
    if (!canManageSocials || pendingIds.current.has(automationId)) {
      return;
    }
    const automation = automations.find(
      (candidate) => candidate.id === automationId
    );
    if (!automation) {
      return;
    }
    pendingIds.current.add(automationId);
    const enabled = !automation.enabled;
    try {
      await toggleMutation.mutateAsync({ id: automationId, enabled });
      analytics.capture(AUTOMATION_TOGGLED, {
        automation_id: automationId,
        is_active: enabled,
      });
      toast.success(enabled ? "Automation enabled" : "Automation disabled");
    } catch (error) {
      const details = getApiErrorDetails(error);
      toast.error(
        details.kind === "permission"
          ? "You do not have permission to change automations"
          : details.message
      );
    } finally {
      pendingIds.current.delete(automationId);
    }
  };

  if (automationsQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Icon
            className="animate-spin text-muted-foreground"
            icon={Loading03Icon}
            size={20}
          />
          <span className="text-muted-foreground">Loading automations...</span>
        </div>
      </div>
    );
  }
  if (automationsQuery.isError) {
    return (
      <RequestError
        error={automationsQuery.error}
        retry={() => automationsQuery.refetch()}
      />
    );
  }

  const handleSelectTemplate = (slug: string | null) => {
    setShowTemplatePicker(false);
    router.push(
      slug ? `/automations/new?template=${slug}` : "/automations/new"
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col space-y-3 p-4 md:space-y-6 md:p-6">
        <AutomationsHeader
          canCreate={canManageSocials}
          onCreateClick={() => setShowTemplatePicker(true)}
        />
        {canManageSocials ? null : (
          <p className="rounded-lg border bg-muted/30 px-4 py-3 text-muted-foreground text-sm">
            You can view automations, but your workspace role cannot change
            them.
          </p>
        )}
        <AutomationStats stats={stats} />
        <AutomationFilters
          filterStatus={filterStatus}
          filterTrigger={filterTrigger}
          searchQuery={searchQuery}
          setFilterStatus={setFilterStatus}
          setFilterTrigger={setFilterTrigger}
          setSearchQuery={setSearchQuery}
          setViewMode={setViewMode}
          viewMode={viewMode}
        />
        <AutomationList
          automations={filteredAutomations}
          canManage={canManageSocials}
          onDelete={handleDelete}
          onToggle={handleToggle}
          viewMode={viewMode}
        />
      </div>
      <TemplatePickerDialog
        onClose={() => setShowTemplatePicker(false)}
        onSelect={handleSelectTemplate}
        open={showTemplatePicker && canManageSocials}
      />
    </div>
  );
}

export default function AutomationsClient() {
  const workspace = useAutomationWorkspace();
  if (workspace.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Icon
          className="animate-spin text-muted-foreground"
          icon={Loading03Icon}
          size={20}
        />
      </div>
    );
  }
  if (workspace.isError) {
    return (
      <RequestError error={workspace.error} retry={() => workspace.refetch()} />
    );
  }
  if (!workspace.scope) {
    return (
      <RequestError
        error={new Error("No workspace is available for this account")}
        retry={() => workspace.refetch()}
      />
    );
  }
  return <AutomationsResourceClient scope={workspace.scope} />;
}
