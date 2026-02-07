"use client";

import { Icon } from "@delulu/design-system/providers/icon";
import { FilterIcon } from "@hugeicons-pro/core-solid-rounded";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import type { ConditionStep } from "../utils/flow-types";

const OPERATOR_LABELS: Record<string, string> = {
  always: "Always (any comment)",
  contains: "Contains",
  not_contains: "Does not contain",
  equals: "Equals",
  starts_with: "Starts with",
  ends_with: "Ends with",
  regex: "Regex",
};

export function ConditionNode({ data, selected }: NodeProps) {
  const step = data.step as ConditionStep;
  const label = OPERATOR_LABELS[step.operator] || step.operator;
  const hasValue = step.operator !== "always" && step.value;

  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-sm transition-all ${
        selected
          ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30"
          : "border-border bg-card hover:border-amber-400/50"
      }`}
      style={{ minWidth: 240 }}
    >
      <Handle className="!bg-amber-500" position={Position.Top} type="target" />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
          <Icon className="text-amber-500" icon={FilterIcon} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">Condition</p>
          <p className="truncate text-muted-foreground text-xs">
            {label}
            {hasValue ? `: "${step.value}"` : ""}
          </p>
        </div>
      </div>
      <Handle
        className="!bg-green-500"
        id="yes"
        position={Position.Bottom}
        style={{ left: "30%" }}
        type="source"
      />
      <Handle
        className="!bg-red-500"
        id="no"
        position={Position.Bottom}
        style={{ left: "70%" }}
        type="source"
      />
    </div>
  );
}
