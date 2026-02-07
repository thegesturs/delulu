'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@delulu/design-system/components/ui/popover';
import { Icon } from '@delulu/design-system/providers/icon';
import {
  Add01Icon,
  FilterIcon,
  MailSend01Icon,
} from '@hugeicons-pro/core-solid-rounded';
import { useState } from 'react';

interface AddStepMenuProps {
  onAddCondition: () => void;
  onAddSendDm: () => void;
}

export function AddStepMenu({ onAddCondition, onAddSendDm }: AddStepMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-full border-dashed"
        >
          <Icon icon={Add01Icon} size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="center">
        <button
          type="button"
          onClick={() => {
            onAddCondition();
            setOpen(false);
          }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/15">
            <Icon icon={FilterIcon} size={14} className="text-amber-500" />
          </div>
          Condition
        </button>
        <button
          type="button"
          onClick={() => {
            onAddSendDm();
            setOpen(false);
          }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-500/15">
            <Icon icon={MailSend01Icon} size={14} className="text-green-500" />
          </div>
          Send DM
        </button>
      </PopoverContent>
    </Popover>
  );
}
