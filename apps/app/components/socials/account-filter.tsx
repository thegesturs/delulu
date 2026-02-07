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
    <div className="rounded-xl border-border bg-card/60 p-4 backdrop-blur-sm">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Icon
              className="absolute top-1/2 left-3 -translate-y-1/2 transform text-muted-foreground"
              icon={Search01Icon}
              size={16}
            />
            <Input
              className="border-input bg-background/80 pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accounts..."
              value={searchQuery}
            />
          </div>

          <Select onValueChange={setFilterPlatform} value={filterPlatform}>
            <SelectTrigger className="w-full border-input bg-background/80 sm:w-40">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="TWITTER">Twitter</SelectItem>
              <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setFilterStatus} value={filterStatus}>
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
            className="h-9 w-9 p-0"
            onClick={() => setViewMode("list")}
            size="sm"
            variant={viewMode === "list" ? "default" : "outline"}
          >
            <Icon className="" icon={Menu01Icon} size={16} />
          </Button>
          <Button
            className="h-9 w-9 p-0"
            onClick={() => setViewMode("grid")}
            size="sm"
            variant={viewMode === "grid" ? "default" : "outline"}
          >
            <Icon className="" icon={GridViewIcon} size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
