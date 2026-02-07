"use client";

import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import { Card, CardContent } from "@delulu/design-system/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@delulu/design-system/components/ui/dropdown-menu";
import { Switch } from "@delulu/design-system/components/ui/switch";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  AnalyticsUpIcon,
  Cancel01Icon,
  Comment01Icon,
  Delete01Icon,
  Edit01Icon,
  MailSend01Icon,
  MoreHorizontalIcon,
  TickDouble01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import Link from "next/link";
import { useState } from "react";
import type { Automation } from "@/types/convex";
import DeleteAlertDialog from "../alerts/delete-post";

interface AutomationCardProps {
  automation: Automation;
  viewMode: "grid" | "list";
  onDelete: (id: Id<"automations">) => void;
  onToggle: (id: Id<"automations">) => void;
}

const triggerTypeLabels: Record<string, string> = {
  COMMENT: "Comment",
  MENTION: "Mention",
  STORY_REPLY: "Story Reply",
};

const triggerTypeIcons: Record<string, typeof Comment01Icon> = {
  COMMENT: Comment01Icon,
  MENTION: Comment01Icon,
  STORY_REPLY: Comment01Icon,
};

function getPrimaryTriggerType(automation: Automation): string {
  if (automation.triggers.length === 0) {
    return "COMMENT";
  }
  return automation.triggers[0].triggerType;
}

function formatStepsSummary(automation: Automation): string {
  const conditionSteps = automation.steps.filter((s) => s.type === "condition");
  const dmSteps = automation.steps.filter((s) => s.type === "send_dm");

  if (conditionSteps.length === 0 && dmSteps.length === 0) {
    return "No steps configured";
  }

  const parts: string[] = [];
  if (conditionSteps.length > 0) {
    const first = conditionSteps[0];
    if (first.type === "condition") {
      if (first.operator === "always") {
        parts.push("Always trigger");
      } else if (first.value) {
        parts.push(`${first.operator} "${first.value}"`);
      } else {
        parts.push(first.operator);
      }
    }
  }
  if (dmSteps.length > 0) {
    parts.push(`${dmSteps.length} DM${dmSteps.length > 1 ? "s" : ""}`);
  }
  return parts.join(" • ");
}

export function AutomationCard({
  automation,
  viewMode,
  onDelete,
  onToggle,
}: AutomationCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const primaryTriggerType = getPrimaryTriggerType(automation);
  const TriggerIcon = triggerTypeIcons[primaryTriggerType] || Comment01Icon;
  const successRate =
    automation.totalDMsSent + automation.totalFailed > 0
      ? Math.round(
          (automation.totalDMsSent /
            (automation.totalDMsSent + automation.totalFailed)) *
            100
        )
      : 0;

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(automation._id);
    } finally {
      setIsToggling(false);
    }
  };

  if (viewMode === "list") {
    return (
      <Card className="group background-blue-sm transition-all duration-200 hover:bg-card/80">
        <CardContent className="flex items-center gap-4 p-4">
          {/* Trigger Icon */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
            <Icon className="text-white" icon={TriggerIcon} size={20} />
          </div>

          {/* Main Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium text-foreground">
                {automation.name}
              </h3>
              <Badge
                className="text-xs"
                variant={automation.isActive ? "default" : "secondary"}
              >
                {automation.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-muted-foreground text-sm">
              {triggerTypeLabels[primaryTriggerType]} •{" "}
              {formatStepsSummary(automation)}
            </p>
          </div>

          {/* Stats */}
          <div className="hidden items-center gap-6 md:flex">
            <div className="text-center">
              <p className="font-medium text-foreground">
                {automation.totalDMsSent}
              </p>
              <p className="text-muted-foreground text-xs">DMs Sent</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">{successRate}%</p>
              <p className="text-muted-foreground text-xs">Success</p>
            </div>
          </div>

          {/* Toggle and Actions */}
          <div className="flex items-center gap-2">
            <Switch
              checked={automation.isActive}
              disabled={isToggling}
              onCheckedChange={handleToggle}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  size="icon"
                  variant="ghost"
                >
                  <Icon icon={MoreHorizontalIcon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/automations/${automation._id}`}>
                    <Icon className="mr-2" icon={Edit01Icon} size={16} />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/automations/${automation._id}/analytics`}>
                    <Icon className="mr-2" icon={AnalyticsUpIcon} size={16} />
                    View Analytics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Icon className="mr-2" icon={Delete01Icon} size={16} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
        <DeleteAlertDialog
          description="Are you sure you want to delete this automation? This action cannot be undone."
          isLoading={isDeleting}
          onConfirm={() => {
            setIsDeleting(true);
            onDelete(automation._id);
          }}
          onOpenChange={setDeleteDialogOpen}
          open={deleteDialogOpen}
          title="Delete Automation"
        />
      </Card>
    );
  }

  // Grid View
  return (
    <Card className="group background-blue-sm flex h-full flex-col transition-all duration-200 hover:bg-card/80">
      <CardContent className="flex flex-1 flex-col p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
            <Icon className="text-white" icon={TriggerIcon} size={20} />
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className="text-xs"
              variant={automation.isActive ? "default" : "secondary"}
            >
              {automation.isActive ? "Active" : "Inactive"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 w-8" size="icon" variant="ghost">
                  <Icon icon={MoreHorizontalIcon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/automations/${automation._id}`}>
                    <Icon className="mr-2" icon={Edit01Icon} size={16} />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/automations/${automation._id}/analytics`}>
                    <Icon className="mr-2" icon={AnalyticsUpIcon} size={16} />
                    View Analytics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Icon className="mr-2" icon={Delete01Icon} size={16} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="mb-1 font-medium text-foreground">
            {automation.name}
          </h3>
          <p className="mb-2 text-muted-foreground text-sm">
            {triggerTypeLabels[primaryTriggerType]}
          </p>
          <p className="line-clamp-2 text-muted-foreground text-xs">
            {formatStepsSummary(automation)}
          </p>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-border border-t pt-4">
          <div className="flex items-center gap-1.5">
            <Icon className="text-green-500" icon={MailSend01Icon} size={14} />
            <span className="text-foreground text-sm">
              {automation.totalDMsSent}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon className="text-red-500" icon={Cancel01Icon} size={14} />
            <span className="text-foreground text-sm">
              {automation.totalFailed}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon className="text-blue-500" icon={TickDouble01Icon} size={14} />
            <span className="text-foreground text-sm">{successRate}%</span>
          </div>
        </div>

        {/* Toggle */}
        <div className="mt-4 flex items-center justify-between border-border border-t pt-4">
          <span className="text-muted-foreground text-sm">
            {automation.isActive ? "Enabled" : "Disabled"}
          </span>
          <Switch
            checked={automation.isActive}
            disabled={isToggling}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
      <DeleteAlertDialog
        description="Are you sure you want to delete this automation? This action cannot be undone."
        isLoading={isDeleting}
        onConfirm={() => {
          setIsDeleting(true);
          onDelete(automation._id);
        }}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        title="Delete Automation"
      />
    </Card>
  );
}
