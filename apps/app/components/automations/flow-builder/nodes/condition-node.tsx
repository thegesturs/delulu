'use client';

import { Icon } from '@delulu/design-system/providers/icon';
import { FilterIcon } from '@hugeicons-pro/core-solid-rounded';
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { ConditionStep } from '../utils/flow-types';

const OPERATOR_LABELS: Record<string, string> = {
  always: 'Always (any comment)',
  contains: 'Contains',
  not_contains: 'Does not contain',
  equals: 'Equals',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
  regex: 'Regex',
};

export function ConditionNode({ data, selected }: NodeProps) {
  const step = data.step as ConditionStep;
  const label = OPERATOR_LABELS[step.operator] || step.operator;
  const hasValue = step.operator !== 'always' && step.value;

  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-sm transition-all ${
        selected
          ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
          : 'border-border bg-card hover:border-amber-400/50'
      }`}
      style={{ minWidth: 240 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-500" />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
          <Icon icon={FilterIcon} size={18} className="text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">Condition</p>
          <p className="truncate text-muted-foreground text-xs">
            {label}
            {hasValue ? `: "${step.value}"` : ''}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="!bg-green-500"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="!bg-red-500"
        style={{ left: '70%' }}
      />
    </div>
  );
}
