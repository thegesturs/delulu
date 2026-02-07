'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { Input } from '@delulu/design-system/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@delulu/design-system/components/ui/select';
import { Icon } from '@delulu/design-system/providers/icon';
import {
  GridViewIcon,
  Menu01Icon,
  Search01Icon,
} from '@hugeicons-pro/core-solid-rounded';

interface AutomationFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterTrigger: string;
  setFilterTrigger: (value: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (value: 'grid' | 'list') => void;
}

export function AutomationFilters({
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterTrigger,
  setFilterTrigger,
  viewMode,
  setViewMode,
}: AutomationFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Icon
            icon={Search01Icon}
            size={16}
            className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground"
          />
          <Input
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Trigger Type Filter */}
        <Select value={filterTrigger} onValueChange={setFilterTrigger}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Trigger" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Triggers</SelectItem>
            <SelectItem value="COMMENT">Comment</SelectItem>
            <SelectItem value="MENTION">Mention</SelectItem>
            <SelectItem value="STORY_REPLY">Story Reply</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
        <Button
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
          className="h-8 px-3"
        >
          <Icon icon={Menu01Icon} size={16} />
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('grid')}
          className="h-8 px-3"
        >
          <Icon icon={GridViewIcon} size={16} />
        </Button>
      </div>
    </div>
  );
}
