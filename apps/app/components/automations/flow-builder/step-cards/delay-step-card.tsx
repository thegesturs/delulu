"use client";

import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import { Cancel01Icon, Clock01Icon } from "@hugeicons-pro/core-solid-rounded";
import type { DelayStep } from "../utils/flow-types";

interface DelayStepCardProps {
  step: DelayStep;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
}

function formatDelay(duration: number, unit: string): string {
  return `${duration} ${unit === "minutes" ? "min" : unit}`;
}

export function DelayStepCard({
  step,
  isSelected,
  onClick,
  onRemove,
}: DelayStepCardProps) {
  return (
    <button
      className={cn(
        "group relative w-full max-w-xs rounded-xl border px-4 py-3 text-left transition-all",
        isSelected
          ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30"
          : "border-border bg-card hover:border-indigo-400/50 hover:bg-indigo-500/5"
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15">
          <Icon className="text-indigo-500" icon={Clock01Icon} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">Delay</p>
          <p className="text-muted-foreground text-xs">
            Wait {formatDelay(step.duration, step.unit)}
          </p>
        </div>
      </div>
      <button
        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted opacity-0 transition-opacity hover:bg-destructive hover:text-white group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        type="button"
      >
        <Icon icon={Cancel01Icon} size={10} />
      </button>
    </button>
  );
}
