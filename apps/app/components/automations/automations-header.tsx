"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@delulu/design-system/components/ui/tooltip";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Add01Icon,
  InformationCircleIcon,
} from "@hugeicons-pro/core-solid-rounded";

interface AutomationsHeaderProps {
  onCreateClick: () => void;
}

export function AutomationsHeader({ onCreateClick }: AutomationsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-semibold text-2xl text-foreground tracking-tight">
            Comment-to-Sale Automations
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Turn Instagram comments into sales. Someone comments a keyword →
            they get a DM with your link. Automatically.
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="h-6 w-6" size="icon" variant="ghost">
                <Icon
                  className="text-muted-foreground"
                  icon={InformationCircleIcon}
                  size={16}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Set up triggers for your Instagram posts. When someone comments
                a specific keyword, Delulu sends them a DM with your link and
                replies to their comment. Like ManyChat, but included in your
                plan.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button className="gap-2" onClick={onCreateClick}>
        <Icon icon={Add01Icon} size={16} />
        Create Automation
      </Button>
    </div>
  );
}
