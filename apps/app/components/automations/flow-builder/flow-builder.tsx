"use client";

import { useAnalytics } from "@delulu/analytics/posthog/client";
import {
  AUTOMATION_CREATED,
  AUTOMATION_UPDATED,
  AUTOMATION_TOGGLED,
} from "@delulu/analytics/events";
import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Button } from "@delulu/design-system/components/ui/button";
import { useIsMobile } from "@delulu/design-system/hooks/use-mobile";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Comment01Icon,
  Edit01Icon,
  Loading03Icon,
  MailSend01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import {
  type Connection,
  type Edge,
  type Node,
  ReactFlowProvider,
} from "@xyflow/react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";
import { FlowCanvas } from "./flow-canvas";
import { FlowSidebarPanel } from "./flow-sidebar-panel";
import { FlowToolbar } from "./flow-toolbar";
import type { NodePositions } from "./hooks/use-automation-state";
import { useAutomationState } from "./hooks/use-automation-state";
import { MobileFlowEditor } from "./mobile-flow-editor";
import { getTemplateBySlug } from "./templates/automation-templates";
import { TriggerWizard } from "./trigger-wizard/trigger-wizard";
import { stepsToFlow } from "./utils/auto-layout";
import type { AutomationStep, Note, TriggerStep } from "./utils/flow-types";
import { validateFlow } from "./utils/flow-validation";
import {
  createConditionStep,
  createId,
  createSendDmStep,
} from "./utils/step-helpers";

const BUTTON_HANDLE_RE = /^button_(\d+)$/;

interface FlowBuilderProps {
  automationId?: string;
  templateSlug?: string;
}

function FlowBuilderInner({ automationId, templateSlug }: FlowBuilderProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { isFree: isFreePlan } = useSubscription();
  const analytics = useAnalytics();
  const isNew = !automationId;
  const [isSaving, setIsSaving] = useState(false);
  const [showTriggerWizard, setShowTriggerWizard] = useState(false);
  const initializedRef = useRef(false);
  const templateInitRef = useRef(false);

  const automation = useQuery(
    api.automations.getAutomation,
    automationId ? { id: automationId as Id<"automations"> } : "skip"
  );
  const socialProviders = useQuery(api.social_providers.getConnectedAccounts);
  const createAutomation = useMutation(api.automations.createAutomation);
  const updateAutomation = useMutation(api.automations.updateAutomation);

  const instagramProviders = useMemo(() => {
    if (!socialProviders) {
      return [];
    }
    return socialProviders.filter((p) => p.socialType === "INSTAGRAM");
  }, [socialProviders]);

  const state = useAutomationState();
  const {
    triggers,
    setTriggers,
    steps,
    setSteps,
    notes,
    setNotes,
    nodePositions,
    setNodePositions,
    selectedStepId,
    setSelectedStepId,
    isDirty,
    resetDirty,
    automationMeta,
    setAutomationMeta,
    markDirty,
    addTrigger,
    updateTrigger,
    updateStepById,
    removeStepById,
    addNote,
    updateNote,
    removeNote,
    updateNodePosition,
  } = state;

  // Template state for pre-selecting trigger type in wizard
  const [templateTriggerType, setTemplateTriggerType] = useState<
    "COMMENT" | "STORY_REPLY" | undefined
  >(undefined);

  // Initialize from template
  useEffect(() => {
    if (!templateSlug || templateInitRef.current || !socialProviders) {
      return;
    }

    const template = getTemplateBySlug(templateSlug);
    if (!template) {
      return;
    }

    templateInitRef.current = true;
    const {
      steps: tSteps,
      firstStepId,
      notes: tNotes,
      nodePositions: tPositions,
    } = template.buildSteps({
      instagramUsername:
        socialProviders?.find((p) => p.socialType === "INSTAGRAM")?.username ??
        undefined,
    });

    setSteps(tSteps);
    setNotes(tNotes);
    setNodePositions(tPositions);
    setTemplateTriggerType(
      template.triggerType === "COMMENT" ||
        template.triggerType === "STORY_REPLY"
        ? template.triggerType
        : undefined
    );

    // Store firstStepId so the trigger wizard can link to it
    templateFirstStepRef.current = firstStepId;

    // Open trigger wizard to complete setup
    setShowTriggerWizard(true);
  }, [templateSlug, socialProviders, setSteps, setNotes, setNodePositions]);

  const templateFirstStepRef = useRef<string | undefined>(undefined);

  // Initialize from existing automation
  useEffect(() => {
    if (!automation || initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    setAutomationMeta({
      name: automation.name,
      description: automation.description || "",
      isActive: automation.isActive,
      socialProviderId: automation.socialProviderId,
    });

    // Recombine pendingPostIds into targetPostIds with pending: prefix for UI
    const loadedTriggers = automation.triggers.map((trigger) => ({
      ...trigger,
      targetPostIds: [
        ...trigger.targetPostIds,
        ...(trigger.pendingPostIds ?? []).map((id: string) => `pending:${id}`),
      ],
    }));
    setTriggers(loadedTriggers);
    setSteps(automation.steps);
    setNotes(((automation as Record<string, unknown>).notes as Note[]) ?? []);
    setNodePositions(
      ((automation as Record<string, unknown>)
        .nodePositions as NodePositions) ?? {}
    );
    resetDirty(
      loadedTriggers,
      automation.steps,
      ((automation as Record<string, unknown>).notes as Note[]) ?? [],
      ((automation as Record<string, unknown>)
        .nodePositions as NodePositions) ?? {}
    );
  }, [
    automation,
    setAutomationMeta,
    setTriggers,
    setSteps,
    setNotes,
    setNodePositions,
    resetDirty,
  ]);

  // Open trigger wizard automatically for new automations (without template)
  useEffect(() => {
    if (
      isNew &&
      !templateSlug &&
      triggers.length === 0 &&
      socialProviders !== undefined
    ) {
      setShowTriggerWizard(true);
    }
  }, [isNew, templateSlug, triggers.length, socialProviders]);

  // Compute React Flow nodes/edges from step-based state
  const { nodes: stepNodes, edges } = useMemo(
    () => stepsToFlow(triggers, steps),
    [triggers, steps]
  );

  // Apply stored position overrides and add note nodes
  const nodes = useMemo(() => {
    // Override step/trigger node positions from stored positions
    const positionedNodes = stepNodes.map((node) => {
      const stored = nodePositions[node.id];
      if (stored) {
        return { ...node, position: stored };
      }
      return node;
    });

    // Add note nodes
    const noteNodes: Node[] = notes.map((note) => ({
      id: note.id,
      type: "note",
      position: nodePositions[note.id] ?? note.position,
      data: { note },
    }));

    return [...positionedNodes, ...noteNodes];
  }, [stepNodes, notes, nodePositions]);

  const handleTriggerWizardComplete = useCallback(
    (trigger: TriggerStep, socialProviderId: string) => {
      // Set social provider if this is the first trigger
      if (triggers.length === 0) {
        setAutomationMeta((prev) => ({ ...prev, socialProviderId }));
      }

      // If template provided a first step, link to it
      const templateFirstStep = templateFirstStepRef.current;
      if (templateFirstStep && steps.some((s) => s.id === templateFirstStep)) {
        addTrigger({ ...trigger, nextStepId: templateFirstStep });
        templateFirstStepRef.current = undefined;
        setTemplateTriggerType(undefined);
      } else if (steps.length > 0) {
        // Link to existing first step
        addTrigger({ ...trigger, nextStepId: steps[0].id });
      } else {
        // Auto-create a Send DM step and link it
        const dmStep = createSendDmStep();
        addTrigger({ ...trigger, nextStepId: dmStep.id });
        setSteps((prev) => [...prev, dmStep]);
        markDirty();
      }
      setShowTriggerWizard(false);
    },
    [triggers.length, steps, addTrigger, setAutomationMeta, setSteps, markDirty]
  );

  const handleAddSendDm = useCallback(() => {
    const newStep = createSendDmStep();
    setSteps((prev) => [...prev, newStep]);
    markDirty();
    setSelectedStepId(newStep.id);
  }, [setSteps, markDirty, setSelectedStepId]);

  const handleAddNote = useCallback(() => {
    const note: Note = {
      id: `note_${createId()}`,
      content: "",
      position: { x: 400, y: 100 },
    };
    addNote(note);
    setSelectedStepId(note.id);
  }, [addNote, setSelectedStepId]);

  const handleNodeDragStop = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      updateNodePosition(nodeId, position);
    },
    [updateNodePosition]
  );

  // When the user drags an edge from a source handle to a target node
  const handleConnect = useCallback(
    (connection: Connection) => {
      const { source, target, sourceHandle } = connection;
      if (!(source && target)) {
        return;
      }

      // Source is a trigger
      const sourceTrigger = triggers.find((t) => t.id === source);
      if (sourceTrigger) {
        updateTrigger(source, { nextStepId: target });
        return;
      }

      // Source is a step
      const sourceStep = steps.find((s) => s.id === source);
      if (!sourceStep) {
        return;
      }

      if (sourceStep.type === "condition") {
        if (sourceHandle === "yes") {
          updateStepById(source, { yesStepId: target });
        } else if (sourceHandle === "no") {
          updateStepById(source, { noStepId: target });
        }
      } else if (sourceStep.type === "send_dm") {
        const buttonMatch = sourceHandle?.match(BUTTON_HANDLE_RE);
        if (buttonMatch) {
          const btnIndex = Number.parseInt(buttonMatch[1], 10);
          const buttons = [...(sourceStep.buttons ?? [])];
          const btn = buttons[btnIndex];
          if (btn?.type === "quick_reply") {
            buttons[btnIndex] = { ...btn, nextStepId: target };
            updateStepById(source, { buttons });
          }
        } else {
          updateStepById(source, { nextStepId: target });
        }
      }
    },
    [triggers, steps, updateTrigger, updateStepById]
  );

  // When the user deletes an edge (select + Backspace)
  const handleEdgeDelete = useCallback(
    (edge: Edge) => {
      const { source, sourceHandle } = edge;

      // Source is a trigger
      const sourceTrigger = triggers.find((t) => t.id === source);
      if (sourceTrigger) {
        updateTrigger(source, { nextStepId: undefined });
        return;
      }

      // Source is a step
      const sourceStep = steps.find((s) => s.id === source);
      if (!sourceStep) {
        return;
      }

      if (sourceStep.type === "condition") {
        if (sourceHandle === "yes") {
          updateStepById(source, { yesStepId: undefined });
        } else if (sourceHandle === "no") {
          updateStepById(source, { noStepId: undefined });
        }
      } else if (sourceStep.type === "send_dm") {
        const buttonMatch = sourceHandle?.match(BUTTON_HANDLE_RE);
        if (buttonMatch) {
          const btnIndex = Number.parseInt(buttonMatch[1], 10);
          const buttons = [...(sourceStep.buttons ?? [])];
          const btn = buttons[btnIndex];
          if (btn?.type === "quick_reply") {
            buttons[btnIndex] = { ...btn, nextStepId: undefined };
            updateStepById(source, { buttons });
          }
        } else {
          updateStepById(source, { nextStepId: undefined });
        }
      }
    },
    [triggers, steps, updateTrigger, updateStepById]
  );

  const handleToggleActive = useCallback(
    (active: boolean) => {
      if (active) {
        const result = validateFlow(triggers, steps);
        if (!result.valid) {
          toast.error(result.errors[0]);
          return;
        }
      }
      analytics.capture(AUTOMATION_TOGGLED, {
        automation_id: automationId,
        is_active: active,
      });
      setAutomationMeta((prev) => ({ ...prev, isActive: active }));
      markDirty();
    },
    [triggers, steps, setAutomationMeta, markDirty, analytics, automationId]
  );

  const handleMetaChange = useCallback(
    (meta: typeof automationMeta) => {
      setAutomationMeta(meta);
      markDirty();
    },
    [setAutomationMeta, markDirty]
  );

  const handleSave = useCallback(async () => {
    if (!automationMeta.socialProviderId) {
      toast.error("Please select an Instagram account");
      return;
    }

    if (triggers.length === 0) {
      toast.error("Please add at least one trigger");
      return;
    }

    // Auto-generate name if empty
    let name = automationMeta.name.trim();
    if (!name) {
      const trigger = triggers[0];
      const typeLabel =
        trigger.triggerType === "STORY_REPLY"
          ? "Story Reply"
          : trigger.triggerType === "MENTION"
            ? "Mention"
            : "Comment";
      const keywordPart =
        trigger.keywordFilter?.value &&
        trigger.keywordFilter.operator !== "always"
          ? ` (${trigger.keywordFilter.value})`
          : "";
      name = `${typeLabel}${keywordPart} → DM`;
    }

    // Split pending: prefixed IDs from real targetPostIds
    const processedTriggers = triggers.map((trigger) => {
      const pendingIds: string[] = [];
      const realIds: string[] = [];
      for (const id of trigger.targetPostIds) {
        if (id.startsWith("pending:")) {
          pendingIds.push(id.slice("pending:".length));
        } else {
          realIds.push(id);
        }
      }
      return {
        ...trigger,
        targetPostIds: realIds,
        pendingPostIds:
          pendingIds.length > 0
            ? pendingIds
            : (trigger.pendingPostIds ?? undefined),
      };
    });

    setIsSaving(true);
    try {
      if (isNew) {
        const id = await createAutomation({
          name,
          description: automationMeta.description.trim() || undefined,
          socialProviderId:
            automationMeta.socialProviderId as Id<"socialProviders">,
          isActive: automationMeta.isActive,
          triggers: processedTriggers,
          steps,
          notes: notes.length > 0 ? notes : undefined,
          nodePositions:
            Object.keys(nodePositions).length > 0 ? nodePositions : undefined,
        });

        analytics.capture(AUTOMATION_CREATED, {
          automation_id: id,
          trigger_count: processedTriggers.length,
          step_count: steps.length,
          trigger_types: processedTriggers.map((t) => t.triggerType),
          step_types: steps.map((s) => s.type),
          is_active: automationMeta.isActive,
          from_template: !!templateSlug,
          template_slug: templateSlug,
        });

        toast.success("Automation created");
        router.push(`/automations/${id}`);
      } else {
        await updateAutomation({
          id: automationId as Id<"automations">,
          name,
          description: automationMeta.description.trim() || undefined,
          isActive: automationMeta.isActive,
          triggers: processedTriggers,
          steps,
          notes: notes.length > 0 ? notes : undefined,
          nodePositions:
            Object.keys(nodePositions).length > 0 ? nodePositions : undefined,
        });

        analytics.capture(AUTOMATION_UPDATED, {
          automation_id: automationId,
          trigger_count: processedTriggers.length,
          step_count: steps.length,
          trigger_types: processedTriggers.map((t) => t.triggerType),
          step_types: steps.map((s) => s.type),
          is_active: automationMeta.isActive,
        });

        toast.success("Automation saved");
        resetDirty(triggers, steps, notes, nodePositions);
      }
    } catch (error) {
      console.error("Failed to save automation:", error);
      toast.error("Failed to save automation");
    } finally {
      setIsSaving(false);
    }
  }, [
    automationMeta,
    isNew,
    automationId,
    triggers,
    steps,
    notes,
    nodePositions,
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

  const handleCreateStepForButton = useCallback(
    (
      stepId: string,
      buttonIndex: number,
      stepType: "send_dm" | "condition"
    ) => {
      const newStep =
        stepType === "send_dm" ? createSendDmStep() : createConditionStep();

      // Update the button's nextStepId to point to the new step
      setSteps((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== stepId || s.type !== "send_dm") {
            return s;
          }
          const buttons = [...(s.buttons ?? [])];
          const btn = buttons[buttonIndex];
          if (btn?.type === "quick_reply") {
            buttons[buttonIndex] = { ...btn, nextStepId: newStep.id };
          }
          return { ...s, buttons };
        });
        return [...updated, newStep];
      });
      markDirty();
      setSelectedStepId(newStep.id);
    },
    [setSteps, markDirty, setSelectedStepId]
  );

  const handleRemoveStepForButton = useCallback(
    (stepId: string, buttonIndex: number) => {
      setSteps((prev) => {
        const parentStep = prev.find((s) => s.id === stepId);
        if (!parentStep || parentStep.type !== "send_dm") {
          return prev;
        }
        const btn = parentStep.buttons?.[buttonIndex];
        const targetStepId =
          btn?.type === "quick_reply" && "nextStepId" in btn
            ? btn.nextStepId
            : undefined;

        // Clear the button's nextStepId
        let updated = prev.map((s) => {
          if (s.id !== stepId || s.type !== "send_dm") {
            return s;
          }
          const buttons = [...(s.buttons ?? [])];
          const b = buttons[buttonIndex];
          if (b?.type === "quick_reply") {
            buttons[buttonIndex] = { ...b, nextStepId: undefined };
          }
          return { ...s, buttons };
        });

        // Remove the orphaned step if it exists and nothing else references it
        if (targetStepId) {
          updated = updated.filter((s) => s.id !== targetStepId);
        }

        return updated;
      });
      markDirty();
    },
    [setSteps, markDirty]
  );

  // Loading state for edit mode
  if (!isNew && automation === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Icon
          className="animate-spin text-muted-foreground"
          icon={Loading03Icon}
          size={24}
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

  if (isMobile) {
    return (
      <MobileFlowEditor
        instagramProviders={instagramProviders}
        isNew={isNew}
        isSaving={isSaving}
        onSave={handleSave}
        state={state}
        templateFirstStepId={templateFirstStepRef.current}
        templateTriggerType={templateTriggerType}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <FlowToolbar
        automationMeta={automationMeta}
        isDirty={isDirty}
        isSaving={isSaving}
        onMetaChange={handleMetaChange}
        onSave={handleSave}
        onToggleActive={handleToggleActive}
      />
      <div className="relative flex-1">
        <FlowCanvas
          edges={edges}
          nodes={nodes}
          onConnect={handleConnect}
          onEdgeDelete={handleEdgeDelete}
          onNodeClick={handleNodeClick}
          onNodeDragStop={handleNodeDragStop}
        />

        {/* Action cards at bottom */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
          <Button
            className="gap-1.5 shadow-md"
            onClick={() => setShowTriggerWizard(true)}
            size="sm"
            variant="outline"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-purple-500 to-pink-500">
              <Icon className="text-white" icon={Comment01Icon} size={12} />
            </div>
            Add Trigger
          </Button>
          <Button
            className="gap-1.5 shadow-md"
            onClick={handleAddSendDm}
            size="sm"
            variant="outline"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-cyan-500">
              <Icon className="text-white" icon={MailSend01Icon} size={12} />
            </div>
            Add Send DM
          </Button>
          <Button
            className="gap-1.5 shadow-md"
            onClick={handleAddNote}
            size="sm"
            variant="outline"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-amber-400 to-orange-400">
              <Icon className="text-white" icon={Edit01Icon} size={12} />
            </div>
            Add Note
          </Button>
        </div>

        <FlowSidebarPanel
          instagramProviders={instagramProviders}
          isFreePlan={isFreePlan}
          notes={notes}
          onClose={() => setSelectedStepId(null)}
          onCreateStepForButton={handleCreateStepForButton}
          onDeleteNote={removeNote}
          onDeleteStep={handleDeleteStep}
          onRemoveStepForButton={handleRemoveStepForButton}
          onSocialProviderChange={(id) => {
            setAutomationMeta((prev) => ({ ...prev, socialProviderId: id }));
            markDirty();
          }}
          onUpdateNote={updateNote}
          onUpdateStep={handleUpdateStep}
          onUpdateTrigger={handleUpdateTrigger}
          selectedId={selectedStepId}
          socialProviderId={automationMeta.socialProviderId}
          steps={steps}
          triggers={triggers}
        />
      </div>

      <TriggerWizard
        currentSocialProviderId={automationMeta.socialProviderId || undefined}
        defaultTriggerType={templateTriggerType}
        instagramProviders={instagramProviders}
        onClose={() => setShowTriggerWizard(false)}
        onComplete={handleTriggerWizardComplete}
        open={showTriggerWizard}
      />
    </div>
  );
}

export function FlowBuilder({ automationId, templateSlug }: FlowBuilderProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <FlowBuilderInner
        automationId={automationId}
        templateSlug={templateSlug}
      />
    );
  }

  return (
    <ReactFlowProvider>
      <FlowBuilderInner
        automationId={automationId}
        templateSlug={templateSlug}
      />
    </ReactFlowProvider>
  );
}
