'use client';

import { Badge } from '@delulu/design-system/components/ui/badge';
import { cn } from '@delulu/design-system/lib/utils';
import { Icon } from '@delulu/design-system/providers/icon';
import {
  Cancel01Icon,
  MailSend01Icon,
} from '@hugeicons-pro/core-solid-rounded';
import type { SendDmStep } from '../utils/flow-types';

interface SendDmStepCardProps {
  step: SendDmStep;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
}

export function SendDmStepCard({
  step,
  isSelected,
  onClick,
  onRemove,
}: SendDmStepCardProps) {
  const hasMessage = step.messageTemplate.trim().length > 0;
  const hasButtons = step.buttons && step.buttons.length > 0;
  const hasReply =
    step.commentReply?.enabled && step.commentReply.replies.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full max-w-xs rounded-xl border px-4 py-3 text-left transition-all',
        isSelected
          ? 'border-green-500 bg-green-500/10 ring-1 ring-green-500/30'
          : 'border-border bg-card hover:border-green-400/50 hover:bg-green-500/5'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/15">
          <Icon icon={MailSend01Icon} size={18} className="text-green-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">Send DM</p>
          <p className="truncate text-muted-foreground text-xs">
            {hasMessage
              ? step.messageTemplate.slice(0, 50) +
                (step.messageTemplate.length > 50 ? '...' : '')
              : 'No message set'}
          </p>
        </div>
      </div>
      {(hasButtons || hasReply) && (
        <div className="mt-2 flex gap-1.5 pl-12">
          {hasButtons && (
            <Badge variant="secondary" className="text-[10px]">
              {step.buttons!.length} button
              {step.buttons!.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {hasReply && (
            <Badge variant="secondary" className="text-[10px]">
              + Reply
            </Badge>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="-top-2 -right-2 absolute flex h-5 w-5 items-center justify-center rounded-full bg-muted opacity-0 transition-opacity hover:bg-destructive hover:text-white group-hover:opacity-100"
      >
        <Icon icon={Cancel01Icon} size={10} />
      </button>
    </button>
  );
}
