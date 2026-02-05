'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { Icon } from '@delulu/design-system/providers/icon';
import { Add01Icon, InformationCircleIcon } from '@hugeicons-pro/core-solid-rounded';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@delulu/design-system/components/ui/tooltip';

interface AutomationsHeaderProps {
  onCreateClick: () => void;
}

export function AutomationsHeader({ onCreateClick }: AutomationsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-semibold text-2xl text-foreground tracking-tight">
            Automations
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Automatically send DMs when users comment on your Instagram posts
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Icon icon={InformationCircleIcon} size={16} className="text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Create automations to send private replies when users comment specific
                keywords on your posts. Great for lead generation and engagement!
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button onClick={onCreateClick} className="gap-2">
        <Icon icon={Add01Icon} size={16} />
        Create Automation
      </Button>
    </div>
  );
}
