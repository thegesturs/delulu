"use client";

import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Icon } from "@delulu/design-system/providers/icon";
import { Loading03Icon } from "@hugeicons-pro/core-solid-rounded";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AutomationFilters } from "./automation-filters";
import { AutomationList } from "./automation-list";
import { AutomationStats } from "./automation-stats";
import { AutomationsHeader } from "./automations-header";
import { TemplatePickerDialog } from "./flow-builder/templates/template-picker-dialog";

export default function AutomationsClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTrigger, setFilterTrigger] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const automations = useQuery(api.automations.getAutomations, {});
  const isLoading = automations === undefined;

  const deleteAutomationMutation = useMutation(
    api.automations.deleteAutomation
  );
  const toggleAutomationMutation = useMutation(
    api.automations.toggleAutomation
  );

  const filteredAutomations = useMemo(() => {
    if (!automations) {
      return [];
    }

    return automations.filter((automation) => {
      const matchesSearch =
        automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        automation.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && automation.isActive) ||
        (filterStatus === "inactive" && !automation.isActive);

      const matchesTrigger =
        filterTrigger === "all" ||
        automation.triggers.some((t) => t.triggerType === filterTrigger);

      return matchesSearch && matchesStatus && matchesTrigger;
    });
  }, [automations, searchQuery, filterStatus, filterTrigger]);

  const stats = useMemo(() => {
    if (!automations) {
      return { total: 0, active: 0, inactive: 0, totalDMsSent: 0 };
    }

    const active = automations.filter((a) => a.isActive).length;
    const totalDMsSent = automations.reduce(
      (acc, a) => acc + a.totalDMsSent,
      0
    );

    return {
      total: automations.length,
      active,
      inactive: automations.length - active,
      totalDMsSent,
    };
  }, [automations]);

  const handleDelete = async (automationId: Id<"automations">) => {
    try {
      await deleteAutomationMutation({ id: automationId });
      toast.success("Automation deleted successfully");
    } catch (error) {
      toast.error("Failed to delete automation");
      console.error(error);
    }
  };

  const handleToggle = async (automationId: Id<"automations">) => {
    try {
      const newState = await toggleAutomationMutation({ id: automationId });
      toast.success(newState ? "Automation enabled" : "Automation disabled");
    } catch (error) {
      toast.error("Failed to toggle automation");
      console.error(error);
    }
  };

  if (isLoading) {
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

  const handleSelectTemplate = (slug: string | null) => {
    setShowTemplatePicker(false);
    if (slug) {
      router.push(`/automations/new?template=${slug}`);
    } else {
      router.push("/automations/new");
    }
  };

  return (
    <div className="h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col space-y-6 p-6">
        <AutomationsHeader onCreateClick={() => setShowTemplatePicker(true)} />
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
          onDelete={handleDelete}
          onToggle={handleToggle}
          viewMode={viewMode}
        />
      </div>

      <TemplatePickerDialog
        onClose={() => setShowTemplatePicker(false)}
        onSelect={handleSelectTemplate}
        open={showTemplatePicker}
      />
    </div>
  );
}
