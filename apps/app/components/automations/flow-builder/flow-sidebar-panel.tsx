'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { ScrollArea } from '@delulu/design-system/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@delulu/design-system/components/ui/sheet';
import { Icon } from '@delulu/design-system/providers/icon';
import { Delete02Icon } from '@hugeicons-pro/core-solid-rounded';
import { ConditionPanel } from './panels/condition-panel';
import { SendDmPanel } from './panels/send-dm-panel';
import { TriggerPanel } from './panels/trigger-panel';
import type {
  AutomationStep,
  ConditionStep,
  SendDmStep,
  TriggerStep,
} from './utils/flow-types';

interface SocialProvider {
  _id: string;
  username?: string;
  fullName?: string;
  profileImageUrl?: string;
}

interface FlowSidebarPanelProps {
  selectedId: string | null;
  triggers: TriggerStep[];
  steps: AutomationStep[];
  socialProviderId: string;
  instagramProviders: SocialProvider[];
  isFreePlan?: boolean;
  onSocialProviderChange: (id: string) => void;
  onClose: () => void;
  onUpdateTrigger: (id: string, trigger: TriggerStep) => void;
  onUpdateStep: (id: string, step: Partial<AutomationStep>) => void;
  onDeleteStep: (id: string) => void;
}

export function FlowSidebarPanel({
  selectedId,
  triggers,
  steps,
  socialProviderId,
  instagramProviders,
  isFreePlan,
  onSocialProviderChange,
  onClose,
  onUpdateTrigger,
  onUpdateStep,
  onDeleteStep,
}: FlowSidebarPanelProps) {
  if (!selectedId) {
    return null;
  }

  // Check if it's a trigger
  const trigger = triggers.find((t) => t.id === selectedId);
  if (trigger) {
    return (
      <Sheet open onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-[400px] p-0 sm:max-w-[400px]">
          <SheetHeader className="border-border border-b px-6 py-4">
            <SheetTitle>Trigger Configuration</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-73px)]">
            <div className="px-6 py-5">
              <TriggerPanel
                trigger={trigger}
                socialProviderId={socialProviderId}
                instagramProviders={instagramProviders}
                onSocialProviderChange={onSocialProviderChange}
                onChange={(updated) => onUpdateTrigger(trigger.id, updated)}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  // It's a step
  const step = steps.find((s) => s.id === selectedId);
  if (!step) {
    return null;
  }

  const panelTitle = step.type === 'condition' ? 'Condition' : 'Send DM';

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[400px] p-0 sm:max-w-[400px]">
        <SheetHeader className="border-border border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{panelTitle}</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteStep(step.id)}
              className="text-destructive hover:text-destructive"
            >
              <Icon icon={Delete02Icon} size={14} className="mr-1" />
              Delete
            </Button>
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-73px)]">
          <div className="px-6 py-5">
            {step.type === 'condition' && (
              <ConditionPanel
                step={step as ConditionStep}
                onChange={(updated) => onUpdateStep(step.id, updated)}
              />
            )}
            {step.type === 'send_dm' && (
              <SendDmPanel
                step={step as SendDmStep}
                isFreePlan={isFreePlan}
                onChange={(updated) => onUpdateStep(step.id, updated)}
              />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
