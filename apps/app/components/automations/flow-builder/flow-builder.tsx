'use client';

import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { Button } from '@delulu/design-system/components/ui/button';
import { Icon } from '@delulu/design-system/providers/icon';
import {
  Comment01Icon,
  FilterIcon,
  Loading03Icon,
  MailSend01Icon,
} from '@hugeicons-pro/core-solid-rounded';
import { ReactFlowProvider } from '@xyflow/react';
import { useQuery } from 'convex-helpers/react/cache';
import { useMutation } from 'convex/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FlowCanvas } from './flow-canvas';
import { FlowSidebarPanel } from './flow-sidebar-panel';
import { FlowToolbar } from './flow-toolbar';
import { useAutomationState } from './hooks/use-automation-state';
import { TriggerWizard } from './trigger-wizard/trigger-wizard';
import { stepsToFlow } from './utils/auto-layout';
import { validateFlow } from './utils/flow-validation';
import type { AutomationStep, TriggerStep } from './utils/flow-types';
import { createConditionStep, createSendDmStep } from './utils/step-helpers';

interface FlowBuilderProps {
  automationId?: string;
}

function FlowBuilderInner({ automationId }: FlowBuilderProps) {
  const router = useRouter();
  const isNew = !automationId;
  const [isSaving, setIsSaving] = useState(false);
  const [showTriggerWizard, setShowTriggerWizard] = useState(false);
  const initializedRef = useRef(false);

  const automation = useQuery(
    api.automations.getAutomation,
    automationId ? { id: automationId as Id<'automations'> } : 'skip'
  );
  const socialProviders = useQuery(api.social_providers.getConnectedAccounts);
  const createAutomation = useMutation(api.automations.createAutomation);
  const updateAutomation = useMutation(api.automations.updateAutomation);

  const instagramProviders = useMemo(() => {
    if (!socialProviders) return [];
    return socialProviders.filter((p) => p.socialType === 'INSTAGRAM');
  }, [socialProviders]);

  const state = useAutomationState();
  const {
    triggers,
    setTriggers,
    steps,
    setSteps,
    selectedStepId,
    setSelectedStepId,
    isDirty,
    setIsDirty,
    resetDirty,
    automationMeta,
    setAutomationMeta,
    markDirty,
    addTrigger,
    updateTrigger,
    removeTrigger,
    addStepAfterSync,
    updateStepById,
    removeStepById,
  } = state;

  // Initialize from existing automation
  useEffect(() => {
    if (!automation || initializedRef.current) return;
    initializedRef.current = true;

    setAutomationMeta({
      name: automation.name,
      description: automation.description || '',
      isActive: automation.isActive,
      socialProviderId: automation.socialProviderId,
    });

    setTriggers(automation.triggers);
    setSteps(automation.steps);
    resetDirty(automation.triggers, automation.steps);
  }, [automation, setAutomationMeta, setTriggers, setSteps, resetDirty]);

  // Open trigger wizard automatically for new automations
  useEffect(() => {
    if (isNew && triggers.length === 0 && socialProviders !== undefined) {
      setShowTriggerWizard(true);
    }
  }, [isNew, triggers.length, socialProviders]);

  // Compute React Flow nodes/edges from step-based state
  const { nodes, edges } = useMemo(
    () => stepsToFlow(triggers, steps),
    [triggers, steps]
  );

  const handleTriggerWizardComplete = useCallback(
    (trigger: TriggerStep, socialProviderId: string) => {
      // Set social provider if this is the first trigger
      if (triggers.length === 0) {
        setAutomationMeta((prev) => ({ ...prev, socialProviderId }));
      }

      // Set nextStepId to first step if there are existing steps
      const firstStepId = steps.length > 0 ? steps[0].id : undefined;
      addTrigger({ ...trigger, nextStepId: firstStepId });
      setShowTriggerWizard(false);
    },
    [triggers.length, steps, addTrigger, setAutomationMeta]
  );

  const handleAddCondition = useCallback(() => {
    const newStep = createConditionStep();
    // Find the last trigger's nextStepId chain — insert at end
    if (triggers.length > 0) {
      const lastTrigger = triggers[0];
      if (!lastTrigger.nextStepId) {
        // No steps yet, connect trigger → new condition
        updateTrigger(lastTrigger.id, { nextStepId: newStep.id });
        setSteps((prev) => [...prev, newStep]);
        markDirty();
      } else {
        addStepAfterSync(findLastStepId(lastTrigger.nextStepId, steps), 'next', newStep);
      }
    }
    setSelectedStepId(newStep.id);
  }, [triggers, steps, updateTrigger, setSteps, markDirty, addStepAfterSync, setSelectedStepId]);

  const handleAddSendDm = useCallback(() => {
    const newStep = createSendDmStep();
    if (triggers.length > 0) {
      const lastTrigger = triggers[0];
      if (!lastTrigger.nextStepId) {
        updateTrigger(lastTrigger.id, { nextStepId: newStep.id });
        setSteps((prev) => [...prev, newStep]);
        markDirty();
      } else {
        addStepAfterSync(findLastStepId(lastTrigger.nextStepId, steps), 'next', newStep);
      }
    }
    setSelectedStepId(newStep.id);
  }, [triggers, steps, updateTrigger, setSteps, markDirty, addStepAfterSync, setSelectedStepId]);

  const handleToggleActive = useCallback(
    (active: boolean) => {
      if (active) {
        const result = validateFlow(triggers, steps);
        if (!result.valid) {
          toast.error(result.errors[0]);
          return;
        }
      }
      setAutomationMeta((prev) => ({ ...prev, isActive: active }));
      markDirty();
    },
    [triggers, steps, setAutomationMeta, markDirty]
  );

  const handleMetaChange = useCallback(
    (meta: typeof automationMeta) => {
      setAutomationMeta(meta);
      markDirty();
    },
    [setAutomationMeta, markDirty]
  );

  const handleSave = useCallback(async () => {
    if (!automationMeta.name.trim()) {
      toast.error('Please enter an automation name');
      return;
    }

    if (!automationMeta.socialProviderId) {
      toast.error('Please select an Instagram account');
      return;
    }

    if (triggers.length === 0) {
      toast.error('Please add at least one trigger');
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        const id = await createAutomation({
          name: automationMeta.name.trim(),
          description: automationMeta.description.trim() || undefined,
          socialProviderId: automationMeta.socialProviderId as Id<'socialProviders'>,
          isActive: automationMeta.isActive,
          triggers,
          steps,
        });
        toast.success('Automation created');
        router.push(`/automations/${id}`);
      } else {
        await updateAutomation({
          id: automationId as Id<'automations'>,
          name: automationMeta.name.trim(),
          description: automationMeta.description.trim() || undefined,
          isActive: automationMeta.isActive,
          triggers,
          steps,
        });
        toast.success('Automation saved');
        resetDirty(triggers, steps);
      }
    } catch (error) {
      console.error('Failed to save automation:', error);
      toast.error('Failed to save automation');
    } finally {
      setIsSaving(false);
    }
  }, [
    automationMeta,
    isNew,
    automationId,
    triggers,
    steps,
    createAutomation,
    updateAutomation,
    router,
    resetDirty,
  ]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedStepId(nodeId);
    },
    [setSelectedStepId]
  );

  const handleUpdateTrigger = useCallback(
    (id: string, updated: TriggerStep) => {
      updateTrigger(id, updated);
    },
    [updateTrigger]
  );

  const handleUpdateStep = useCallback(
    (id: string, patch: Partial<AutomationStep>) => {
      updateStepById(id, patch);
    },
    [updateStepById]
  );

  const handleDeleteStep = useCallback(
    (id: string) => {
      removeStepById(id);
    },
    [removeStepById]
  );

  // Loading state for edit mode
  if (!isNew && automation === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icon
          icon={Loading03Icon}
          size={24}
          className="animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  if (!isNew && automation === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <p className="text-muted-foreground">Automation not found</p>
        <Link href="/automations">
          <Button variant="link">Back to Automations</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <FlowToolbar
        automationMeta={automationMeta}
        onMetaChange={handleMetaChange}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onToggleActive={handleToggleActive}
      />
      <div className="relative flex-1">
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
        />

        {/* Action cards at bottom */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTriggerWizard(true)}
            className="gap-1.5 shadow-md"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-purple-500 to-pink-500">
              <Icon icon={Comment01Icon} size={12} className="text-white" />
            </div>
            Add Trigger
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCondition}
            disabled={triggers.length === 0}
            className="gap-1.5 shadow-md"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/15">
              <Icon icon={FilterIcon} size={12} className="text-amber-600" />
            </div>
            Add Condition
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddSendDm}
            disabled={triggers.length === 0}
            className="gap-1.5 shadow-md"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-green-500/15">
              <Icon icon={MailSend01Icon} size={12} className="text-green-600" />
            </div>
            Add Send DM
          </Button>
        </div>

        <FlowSidebarPanel
          selectedId={selectedStepId}
          triggers={triggers}
          steps={steps}
          socialProviderId={automationMeta.socialProviderId}
          instagramProviders={instagramProviders}
          onSocialProviderChange={(id) => {
            setAutomationMeta((prev) => ({ ...prev, socialProviderId: id }));
            markDirty();
          }}
          onClose={() => setSelectedStepId(null)}
          onUpdateTrigger={handleUpdateTrigger}
          onUpdateStep={handleUpdateStep}
          onDeleteStep={handleDeleteStep}
        />
      </div>

      <TriggerWizard
        open={showTriggerWizard}
        onClose={() => setShowTriggerWizard(false)}
        onComplete={handleTriggerWizardComplete}
        instagramProviders={instagramProviders}
        currentSocialProviderId={
          automationMeta.socialProviderId || undefined
        }
      />
    </div>
  );
}

export function FlowBuilder({ automationId }: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner automationId={automationId} />
    </ReactFlowProvider>
  );
}

/**
 * Find the last step in a linear chain (follows nextStepId / yesStepId).
 */
function findLastStepId(startId: string, steps: AutomationStep[]): string {
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  let currentId = startId;
  const visited = new Set<string>();

  while (!visited.has(currentId)) {
    visited.add(currentId);
    const step = stepMap.get(currentId);
    if (!step) break;

    let nextId: string | undefined;
    if (step.type === 'condition') {
      nextId = step.yesStepId;
    } else if (step.type === 'send_dm') {
      nextId = step.nextStepId;
    }

    if (!nextId) break;
    currentId = nextId;
  }

  return currentId;
}
