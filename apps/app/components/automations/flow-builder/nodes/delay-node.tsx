"use client";

import { Icon } from "@delulu/design-system/providers/icon";
import { Clock01Icon } from "@hugeicons-pro/core-solid-rounded";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import type { DelayStep } from "../utils/flow-types";

function formatDelay(duration: number, unit: string): string {
  return `Wait ${duration} ${unit === "minutes" ? "min" : unit}`;
}

export function DelayNode({ data, selected }: NodeProps) {
  const step = data.step as DelayStep;

  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-sm transition-all ${
        selected
          ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30"
          : "border-border bg-card hover:border-indigo-400/50"
      }`}
      style={{ minWidth: 200 }}
    >
      <Handle
        className="!bg-indigo-500"
        position={Position.Top}
        type="target"
      />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15">
          <Icon className="text-indigo-500" icon={Clock01Icon} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">Delay</p>
          <p className="text-muted-foreground text-xs">
            {formatDelay(step.duration, step.unit)}
          </p>
        </div>
      </div>
      <Handle
        className="!bg-indigo-500"
        id="default"
        position={Position.Bottom}
        type="source"
      />
    </div>
  );
}
