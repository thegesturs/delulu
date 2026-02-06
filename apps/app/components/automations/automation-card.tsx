'use client';

import type { Automation } from '@/types/convex';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
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
import { Switch } from '@delulu/design-system/components/ui/switch';
import { Icon } from '@delulu/design-system/providers/icon';
import {
  Comment01Icon,
  MoreHorizontalIcon,
  Delete01Icon,
  Edit01Icon,
  AnalyticsUpIcon,
  MailSend01Icon,
  Cancel01Icon,
  TickDouble01Icon,
} from '@hugeicons-pro/core-solid-rounded';
import { useState } from 'react';
import DeleteAlertDialog from '../alerts/delete-post';
import Link from 'next/link';

interface AutomationCardProps {
  automation: Automation;
  viewMode: 'grid' | 'list';
  onDelete: (id: Id<'automations'>) => void;
  onToggle: (id: Id<'automations'>) => void;
}

const triggerTypeLabels: Record<string, string> = {
  COMMENT: 'Comment',
  MENTION: 'Mention',
  STORY_REPLY: 'Story Reply',
};

const triggerTypeIcons: Record<string, typeof Comment01Icon> = {
  COMMENT: Comment01Icon,
  MENTION: Comment01Icon,
  STORY_REPLY: Comment01Icon,
};

function formatConditions(conditions: Automation['conditions']): string {
  if (conditions.length === 0) return 'No conditions';
  if (conditions[0].operator === 'always') return 'Always trigger';

  const conditionTexts = conditions.slice(0, 2).map((c) => {
    if (c.operator === 'contains' && c.value) return `contains "${c.value}"`;
    if (c.operator === 'equals' && c.value) return `equals "${c.value}"`;
    return c.operator;
  });

  const suffix = conditions.length > 2 ? ` +${conditions.length - 2} more` : '';
  return conditionTexts.join(', ') + suffix;
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

  const TriggerIcon = triggerTypeIcons[automation.triggerType] || Comment01Icon;
  const successRate = automation.totalDMsSent + automation.totalFailed > 0
    ? Math.round((automation.totalDMsSent / (automation.totalDMsSent + automation.totalFailed)) * 100)
    : 0;

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(automation._id);
    } finally {
      setIsToggling(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className="group background-blue-sm transition-all duration-200 hover:bg-card/80">
        <CardContent className="flex items-center gap-4 p-4">
          {/* Trigger Icon */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
            <Icon icon={TriggerIcon} size={20} className="text-white" />
          </div>

          {/* Main Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium text-foreground">{automation.name}</h3>
              <Badge variant={automation.isActive ? 'default' : 'secondary'} className="text-xs">
                {automation.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-muted-foreground text-sm">
              {triggerTypeLabels[automation.triggerType]} • {formatConditions(automation.conditions)}
            </p>
          </div>

          {/* Stats */}
          <div className="hidden items-center gap-6 md:flex">
            <div className="text-center">
              <p className="font-medium text-foreground">{automation.totalDMsSent}</p>
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
              onCheckedChange={handleToggle}
              disabled={isToggling}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Icon icon={MoreHorizontalIcon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/automations/${automation._id}`}>
                    <Icon icon={Edit01Icon} size={16} className="mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/automations/${automation._id}/analytics`}>
                    <Icon icon={AnalyticsUpIcon} size={16} className="mr-2" />
                    View Analytics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Icon icon={Delete01Icon} size={16} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
        <DeleteAlertDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={() => {
            setIsDeleting(true);
            onDelete(automation._id);
          }}
          title="Delete Automation"
          description="Are you sure you want to delete this automation? This action cannot be undone."
          isLoading={isDeleting}
        />
      </Card>
    );
  }

  // Grid View
  return (
    <Card className="group flex h-full flex-col background-blue-sm transition-all duration-200 hover:bg-card/80">
      <CardContent className="flex flex-1 flex-col p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
            <Icon icon={TriggerIcon} size={20} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={automation.isActive ? 'default' : 'secondary'} className="text-xs">
              {automation.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Icon icon={MoreHorizontalIcon} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/automations/${automation._id}`}>
                    <Icon icon={Edit01Icon} size={16} className="mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/automations/${automation._id}/analytics`}>
                    <Icon icon={AnalyticsUpIcon} size={16} className="mr-2" />
                    View Analytics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Icon icon={Delete01Icon} size={16} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="mb-1 font-medium text-foreground">{automation.name}</h3>
          <p className="mb-2 text-muted-foreground text-sm">
            {triggerTypeLabels[automation.triggerType]}
          </p>
          <p className="line-clamp-2 text-muted-foreground text-xs">
            {formatConditions(automation.conditions)}
          </p>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-border border-t pt-4">
          <div className="flex items-center gap-1.5">
            <Icon icon={MailSend01Icon} size={14} className="text-green-500" />
            <span className="text-foreground text-sm">{automation.totalDMsSent}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon icon={Cancel01Icon} size={14} className="text-red-500" />
            <span className="text-foreground text-sm">{automation.totalFailed}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon icon={TickDouble01Icon} size={14} className="text-blue-500" />
            <span className="text-foreground text-sm">{successRate}%</span>
          </div>
        </div>

        {/* Toggle */}
        <div className="mt-4 flex items-center justify-between border-border border-t pt-4">
          <span className="text-muted-foreground text-sm">
            {automation.isActive ? 'Enabled' : 'Disabled'}
          </span>
          <Switch
            checked={automation.isActive}
            onCheckedChange={handleToggle}
            disabled={isToggling}
          />
        </div>
      </CardContent>
      <DeleteAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          setIsDeleting(true);
          onDelete(automation._id);
        }}
        title="Delete Automation"
        description="Are you sure you want to delete this automation? This action cannot be undone."
        isLoading={isDeleting}
      />
    </Card>
  );
}
