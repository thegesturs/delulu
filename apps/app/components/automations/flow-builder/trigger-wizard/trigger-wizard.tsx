"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@delulu/design-system/components/ui/dialog";
import { useState } from "react";
import type { AutomationTriggerType, TriggerStep } from "../utils/flow-types";
import { createTrigger } from "../utils/step-helpers";
import { AccountStep } from "./account-step";
import { PostSelectorStep } from "./post-selector-step";
import { TriggerTypeStep } from "./trigger-type-step";

interface SocialProvider {
  _id: string;
  username?: string;
  fullName?: string;
  profileImageUrl?: string;
}

interface TriggerWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (trigger: TriggerStep, socialProviderId: string) => void;
  instagramProviders: SocialProvider[];
  /** If set, skip account step (editing existing automation) */
  currentSocialProviderId?: string;
}

type WizardStep = "account" | "trigger_type" | "posts";

export function TriggerWizard({
  open,
  onClose,
  onComplete,
  instagramProviders,
  currentSocialProviderId,
}: TriggerWizardProps) {
  const skipAccount = !!currentSocialProviderId;
  const initialStep: WizardStep = skipAccount ? "trigger_type" : "account";

  const [wizardStep, setWizardStep] = useState<WizardStep>(initialStep);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    currentSocialProviderId || null
  );
  const [selectedTriggerType, setSelectedTriggerType] =
    useState<AutomationTriggerType | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  const handleNext = () => {
    if (wizardStep === "account") {
      setWizardStep("trigger_type");
    } else if (wizardStep === "trigger_type") {
      setWizardStep("posts");
    } else if (wizardStep === "posts") {
      if (!(selectedAccountId && selectedTriggerType)) {
        return;
      }
      const trigger = createTrigger({
        triggerType: selectedTriggerType,
        targetPostIds: selectedPostIds,
      });
      onComplete(trigger, selectedAccountId);
      // Reset state
      setWizardStep(initialStep);
      setSelectedAccountId(currentSocialProviderId || null);
      setSelectedTriggerType(null);
      setSelectedPostIds([]);
    }
  };

  const handleBack = () => {
    if (wizardStep === "posts") {
      setWizardStep("trigger_type");
    } else if (wizardStep === "trigger_type" && !skipAccount) {
      setWizardStep("account");
    }
  };

  const canProceed =
    (wizardStep === "account" && selectedAccountId) ||
    (wizardStep === "trigger_type" && selectedTriggerType) ||
    (wizardStep === "posts" && selectedPostIds.length > 0);

  let stepNumber: number;
  if (wizardStep === "account") {
    stepNumber = 1;
  } else if (wizardStep === "trigger_type") {
    stepNumber = skipAccount ? 1 : 2;
  } else {
    stepNumber = skipAccount ? 2 : 3;
  }
  const totalSteps = skipAccount ? 2 : 3;

  return (
    <Dialog onOpenChange={(o) => !o && onClose()} open={open}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Add Trigger
            <span className="ml-2 font-normal text-muted-foreground text-sm">
              Step {stepNumber} of {totalSteps}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {wizardStep === "account" && (
            <AccountStep
              onSelect={setSelectedAccountId}
              providers={instagramProviders}
              selectedId={selectedAccountId}
            />
          )}
          {wizardStep === "trigger_type" && (
            <TriggerTypeStep
              onSelect={setSelectedTriggerType}
              selectedType={selectedTriggerType}
            />
          )}
          {wizardStep === "posts" && selectedAccountId && (
            <PostSelectorStep
              onSelectionChange={setSelectedPostIds}
              selectedPostIds={selectedPostIds}
              socialProviderId={selectedAccountId}
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {((wizardStep === "trigger_type" && !skipAccount) ||
            wizardStep === "posts") && (
            <Button onClick={handleBack} variant="outline">
              Back
            </Button>
          )}
          <Button disabled={!canProceed} onClick={handleNext}>
            {wizardStep === "posts" ? "Add Trigger" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
