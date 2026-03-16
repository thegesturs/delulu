"use client";

import { Badge } from "@delulu/design-system/components/ui/badge";
import { Button } from "@delulu/design-system/components/ui/button";
import { Separator } from "@delulu/design-system/components/ui/separator";
import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Comment01Icon,
  Loading03Icon,
  MailSend01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import type { UseAutomationStateReturn } from "./hooks/use-automation-state";
import { CommentReplyEditor } from "./panels/comment-reply-editor";
import { SendDmPanel } from "./panels/send-dm-panel";
import { KeywordFilterStep } from "./trigger-wizard/keyword-filter-step";
import { PostSelectorStep } from "./trigger-wizard/post-selector-step";
import { TriggerTypeStep } from "./trigger-wizard/trigger-type-step";
import type {
  AutomationTriggerType,
  CommentReply,
  KeywordFilter,
  SendDmStep,
  TriggerStep,
} from "./utils/flow-types";
import { validateFlow } from "./utils/flow-validation";
import { createSendDmStep, createTrigger } from "./utils/step-helpers";

type MobileStep = 1 | 2 | 3 | 4;

interface SocialProvider {
  _id: string;
  username?: string;
  fullName?: string;
  profileImageUrl?: string;
}

interface MobileFlowEditorProps {
  state: UseAutomationStateReturn;
  instagramProviders: SocialProvider[];
  isNew: boolean;
  isSaving: boolean;
  onSave: () => Promise<void>;
}

export function MobileFlowEditor({
  state,
  instagramProviders,
  isNew,
  isSaving,
  onSave,
}: MobileFlowEditorProps) {
  const { isFree: isFreePlan } = useSubscription();
  const {
    triggers,
    steps,
    automationMeta,
    setAutomationMeta,
    addTrigger,
    updateTrigger,
    setSteps,
    markDirty,
    updateStepById,
  } = state;

  const [currentStep, setCurrentStep] = useState<MobileStep>(1);

  // Step 1 state - trigger
  const hasTrigger = triggers.length > 0;
  const trigger = triggers[0] as TriggerStep | undefined;

  // Step 3 - DM step
  const dmStep = steps.find((s) => s.type === "send_dm") as
    | SendDmStep
    | undefined;

  const handleSelectTriggerType = useCallback(
    (type: AutomationTriggerType) => {
      if (hasTrigger && trigger) {
        updateTrigger(trigger.id, { triggerType: type });
      } else {
        const newDmStep = createSendDmStep();
        const newTrigger = createTrigger({
          triggerType: type,
          nextStepId: newDmStep.id,
        });
        if (instagramProviders.length > 0) {
          setAutomationMeta((prev) => ({
            ...prev,
            socialProviderId: instagramProviders[0]._id,
          }));
        }
        addTrigger(newTrigger);
        setSteps([newDmStep]);
      }
    },
    [
      hasTrigger,
      trigger,
      updateTrigger,
      addTrigger,
      setSteps,
      instagramProviders,
      setAutomationMeta,
    ]
  );

  const handlePostsChange = useCallback(
    (postIds: string[]) => {
      if (trigger) {
        updateTrigger(trigger.id, { targetPostIds: postIds });
      }
    },
    [trigger, updateTrigger]
  );

  const handleKeywordChange = useCallback(
    (filter: KeywordFilter | undefined) => {
      if (trigger) {
        updateTrigger(trigger.id, { keywordFilter: filter });
      }
    },
    [trigger, updateTrigger]
  );

  const handleCommentReplyChange = useCallback(
    (commentReply: CommentReply) => {
      if (trigger) {
        updateTrigger(trigger.id, { commentReply });
      }
    },
    [trigger, updateTrigger]
  );

  const handleDmChange = useCallback(
    (updated: SendDmStep) => {
      if (dmStep) {
        updateStepById(dmStep.id, updated);
      }
    },
    [dmStep, updateStepById]
  );

  const handleConfirmLaunch = useCallback(async () => {
    const result = validateFlow(triggers, steps);
    if (!result.valid) {
      const { toast } = await import("sonner");
      toast.error(result.errors[0]);
      return;
    }
    setAutomationMeta((prev) => ({ ...prev, isActive: true }));
    markDirty();
    setTimeout(() => {
      onSave();
    }, 0);
  }, [triggers, steps, setAutomationMeta, markDirty, onSave]);

  const canGoNext = (step: MobileStep): boolean => {
    switch (step) {
      case 1:
        return (
          !!trigger?.triggerType && (trigger?.targetPostIds?.length ?? 0) > 0
        );
      case 2:
      case 3:
      case 4:
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as MobileStep);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as MobileStep);
    }
  };

  const renderPreview = (template: string) =>
    (template || "")
      .replace(/{username}/g, "john_doe")
      .replace(/{comment_text}/g, "Great post!");

  const triggerLabel =
    trigger?.triggerType === "STORY_REPLY"
      ? "Story Reply"
      : trigger?.triggerType === "MENTION"
        ? "Mention"
        : "Comment";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/automations">
            <Button size="icon" variant="ghost">
              <Icon icon={ArrowLeft01Icon} size={20} />
            </Button>
          </Link>
          <span className="font-semibold text-sm">
            {isNew ? "New Automation" : "Edit Automation"}
          </span>
        </div>
        <Button
          disabled={isSaving}
          onClick={onSave}
          size="sm"
          variant="outline"
        >
          {isSaving ? (
            <Icon className="animate-spin" icon={Loading03Icon} size={14} />
          ) : (
            "Save"
          )}
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 px-4 py-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              s <= currentStep ? "bg-primary" : "bg-muted"
            )}
            key={s}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="py-4">
          <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Step {currentStep} of 4
          </p>

          {currentStep === 1 && (
            <div className="space-y-4">
              <TriggerTypeStep
                onSelect={handleSelectTriggerType}
                selectedType={trigger?.triggerType ?? null}
              />
              {trigger?.triggerType && automationMeta.socialProviderId && (
                <>
                  <Separator />
                  <PostSelectorStep
                    onSelectionChange={handlePostsChange}
                    selectedPostIds={trigger.targetPostIds}
                    socialProviderId={automationMeta.socialProviderId}
                    triggerType={trigger.triggerType}
                  />
                </>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <KeywordFilterStep
                filter={trigger?.keywordFilter}
                onChange={handleKeywordChange}
              />
              {trigger?.triggerType === "COMMENT" && (
                <>
                  <Separator />
                  <CommentReplyEditor
                    commentReply={trigger.commentReply}
                    onChange={handleCommentReplyChange}
                  />
                </>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              {dmStep ? (
                <SendDmPanel
                  isFreePlan={isFreePlan}
                  onChange={handleDmChange}
                  step={dmStep}
                />
              ) : (
                <div className="space-y-2 py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    No DM step found.
                  </p>
                  <Button
                    onClick={() => {
                      const newDm = createSendDmStep();
                      setSteps((prev) => [...prev, newDm]);
                      if (trigger) {
                        updateTrigger(trigger.id, { nextStepId: newDm.id });
                      }
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Add DM Step
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Review & Launch</h3>
                <p className="text-muted-foreground text-xs">
                  Let&apos;s review once before we launch.
                </p>
              </div>

              {/* Narrative review - SuperProfile style */}
              <div className="space-y-3 text-sm">
                <p className="font-medium">When someone...</p>
                <p className="text-muted-foreground">
                  {triggerLabel === "Comment"
                    ? "comments on your post"
                    : triggerLabel === "Story Reply"
                      ? "replies to your story"
                      : "mentions you"}{" "}
                  ({trigger?.targetPostIds?.length ?? 0} selected)
                </p>

                {trigger?.keywordFilter &&
                  trigger.keywordFilter.operator !== "always" && (
                    <div className="ml-4 border-border border-l-2 pl-3">
                      <p className="text-muted-foreground">
                        and <strong>{trigger.keywordFilter.operator}</strong>{" "}
                        the keyword{" "}
                        <Badge
                          className="font-mono text-xs"
                          variant="secondary"
                        >
                          {trigger.keywordFilter.value}
                        </Badge>
                      </p>
                    </div>
                  )}

                {trigger?.commentReply?.enabled && (
                  <div className="ml-4 border-border border-l-2 pl-3">
                    <p className="text-muted-foreground">
                      reply to their comment
                    </p>
                    <div className="mt-1.5 rounded-lg border bg-muted/30 px-3 py-2">
                      <p className="text-muted-foreground text-xs italic">
                        &quot;{trigger.commentReply.replies[0]}&quot;
                        {trigger.commentReply.replies.length > 1 && (
                          <span>
                            {" "}
                            (+{trigger.commentReply.replies.length - 1} more)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <p className="pt-1 font-medium">Then send a DM...</p>

                {dmStep?.messageTemplate && (
                  <div className="ml-4 border-border border-l-2 pl-3">
                    <div className="rounded-lg border bg-muted/30 px-3 py-2">
                      <p className="whitespace-pre-wrap text-xs leading-relaxed">
                        {renderPreview(dmStep.messageTemplate)}
                      </p>
                      {isFreePlan && (
                        <p className="mt-1.5 border-border border-t pt-1.5 text-[10px] text-muted-foreground">
                          - - -<br />
                          Sent via @delulu.social
                        </p>
                      )}
                    </div>
                    {(dmStep.buttons?.length ?? 0) > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {dmStep.buttons?.map((btn, i) => (
                          <Badge
                            className="text-[10px]"
                            key={`btn-${i}`}
                            variant="outline"
                          >
                            {btn.title || "Button"}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed footer — tall enough to clear tab bar */}
      <div className="fixed inset-x-0 bottom-0 z-[55] border-t bg-background px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button className="h-11 flex-1" onClick={goBack} variant="outline">
              Back
            </Button>
          )}
          {currentStep < 4 ? (
            <Button
              className="h-11 flex-1"
              disabled={!canGoNext(currentStep)}
              onClick={goNext}
            >
              Next
            </Button>
          ) : (
            <Button
              className="h-11 flex-1"
              disabled={isSaving}
              onClick={handleConfirmLaunch}
            >
              {isSaving ? (
                <Icon
                  className="mr-2 animate-spin"
                  icon={Loading03Icon}
                  size={14}
                />
              ) : (
                <Icon className="mr-2" icon={CheckmarkCircle01Icon} size={14} />
              )}
              Confirm & Launch
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
