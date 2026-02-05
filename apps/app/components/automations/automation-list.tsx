'use client';

import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { AutomationCard } from './automation-card';

interface Automation {
  _id: Id<'automations'>;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: string;
  messageTemplate: string;
  conditions: Array<{ operator: string; value?: string }>;
  totalTriggered: number;
  totalDMsSent: number;
  totalFailed: number;
  maxDMsPerHour: number;
  maxDMsPerDay: number;
  createdAt: number;
  updatedAt: number;
}

interface AutomationListProps {
  automations: Automation[];
  viewMode: 'grid' | 'list';
  onDelete: (id: Id<'automations'>) => void;
  onToggle: (id: Id<'automations'>) => void;
}

export function AutomationList({
  automations,
  viewMode,
  onDelete,
  onToggle,
}: AutomationListProps) {
  if (automations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 py-16">
        <div className="mb-4 rounded-full bg-muted/50 p-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <h3 className="mb-1 font-medium text-foreground text-lg">No automations yet</h3>
        <p className="text-center text-muted-foreground text-sm">
          Create your first automation to automatically reply to Instagram comments
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
          : 'flex flex-col gap-3'
      }
    >
      {automations.map((automation) => (
        <AutomationCard
          key={automation._id}
          automation={automation}
          viewMode={viewMode}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
