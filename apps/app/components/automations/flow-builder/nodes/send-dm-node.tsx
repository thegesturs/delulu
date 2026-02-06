'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge } from '@delulu/design-system/components/ui/badge';
import { Icon } from '@delulu/design-system/providers/icon';
import { MailSend01Icon } from '@hugeicons-pro/core-solid-rounded';
import type { SendDmStep } from '../utils/flow-types';

export function SendDmNode({ data, selected }: NodeProps) {
  const step = data.step as SendDmStep;
  const hasMessage = step.messageTemplate.trim().length > 0;
  const hasButtons = step.buttons && step.buttons.length > 0;
  const hasReply = step.commentReply?.enabled && step.commentReply.replies.length > 0;

  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-sm transition-all ${
        selected
          ? 'border-green-500 bg-green-500/10 ring-1 ring-green-500/30'
          : 'border-border bg-card hover:border-green-400/50'
      }`}
      style={{ minWidth: 240 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-green-500" />
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/15">
          <Icon icon={MailSend01Icon} size={18} className="text-green-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">Send DM</p>
          <p className="truncate text-muted-foreground text-xs">
            {hasMessage
              ? step.messageTemplate.slice(0, 40) +
                (step.messageTemplate.length > 40 ? '...' : '')
              : 'No message set'}
          </p>
        </div>
      </div>
      {(hasButtons || hasReply) && (
        <div className="mt-2 flex gap-1.5 pl-12">
          {hasButtons && (
            <Badge variant="secondary" className="text-[10px]">
              {step.buttons!.length} button{step.buttons!.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {hasReply && (
            <Badge variant="secondary" className="text-[10px]">
              + Reply
            </Badge>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} id="default" className="!bg-green-500" />
    </div>
  );
}
