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
import { Grid3X3, List, Search } from 'lucide-react';

interface AccountFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterPlatform: string;
  setFilterPlatform: (platform: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

export function AccountFilters({
  searchQuery,
  setSearchQuery,
  filterPlatform,
  setFilterPlatform,
  filterStatus,
  setFilterStatus,
  viewMode,
  setViewMode,
}: AccountFiltersProps) {
  return (
    <div className="rounded-xl border-border bg-card/60 p-4 backdrop-blur-sm">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-input bg-background/80 pl-10"
            />
          </div>

          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-full border-input bg-background/80 sm:w-40">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="TWITTER">Twitter</SelectItem>
              <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full border-input bg-background/80 sm:w-32">
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
  );
}
