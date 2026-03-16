"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Input } from "@delulu/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@delulu/design-system/components/ui/select";
import { Icon } from "@delulu/design-system/providers/icon";

import {
  GridViewIcon,
  Menu01Icon,
  Search01Icon,
} from "@hugeicons-pro/core-solid-rounded";

interface AccountFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterPlatform: string;
  setFilterPlatform: (platform: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
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
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Icon
          className="absolute top-1/2 left-3 -translate-y-1/2 transform text-muted-foreground"
          icon={Search01Icon}
          size={16}
        />
        <Input
          className="pl-9"
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          value={searchQuery}
        />
      </div>

      <Select onValueChange={setFilterPlatform} value={filterPlatform}>
        <SelectTrigger className="hidden w-40 sm:flex">
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Platforms</SelectItem>
          <SelectItem value="TWITTER">Twitter</SelectItem>
          <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
        </SelectContent>
      </Select>

      <Select onValueChange={setFilterStatus} value={filterStatus}>
        <SelectTrigger className="hidden w-32 sm:flex">
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

      <div className="hidden items-center gap-1 rounded-lg border border-border bg-background p-1 md:flex">
        <Button
          className="h-8 px-3"
          onClick={() => setViewMode("list")}
          size="sm"
          variant={viewMode === "list" ? "secondary" : "ghost"}
        >
          <Icon icon={Menu01Icon} size={16} />
        </Button>
        <Button
          className="h-8 px-3"
          onClick={() => setViewMode("grid")}
          size="sm"
          variant={viewMode === "grid" ? "secondary" : "ghost"}
        >
          <Icon icon={GridViewIcon} size={16} />
        </Button>
      </div>
    </div>
  );
}
