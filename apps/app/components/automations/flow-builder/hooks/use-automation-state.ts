'use client';

import { useCallback, useRef, useState } from 'react';
import type { AutomationMeta, AutomationStep, TriggerStep } from '../utils/flow-types';
import {
  insertStepAfter,
  removeStep,
  removeStepFromTriggers,
  updateStep,
} from '../utils/step-helpers';

export function useAutomationState() {
  const [triggers, setTriggers] = useState<TriggerStep[]>([]);
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [automationMeta, setAutomationMeta] = useState<AutomationMeta>({
    name: '',
    description: '',
    isActive: true,
    socialProviderId: '',
  });

  const initialStateRef = useRef<string>('');

  const markDirty = useCallback(() => setIsDirty(true), []);

  const resetDirty = useCallback(
    (currentTriggers: TriggerStep[], currentSteps: AutomationStep[]) => {
      initialStateRef.current = JSON.stringify({ triggers: currentTriggers, steps: currentSteps });
      setIsDirty(false);
    },
    []
  );

  // Trigger operations
  const addTrigger = useCallback(
    (trigger: TriggerStep) => {
      setTriggers((prev) => [...prev, trigger]);
      markDirty();
    },
    [markDirty]
  );

  const updateTrigger = useCallback(
    (id: string, patch: Partial<TriggerStep>) => {
      setTriggers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
      markDirty();
    },
    [markDirty]
  );

  const removeTrigger = useCallback(
    (id: string) => {
      setTriggers((prev) => prev.filter((t) => t.id !== id));
      markDirty();
    },
    [markDirty]
  );

  // Step operations
  const addStepAfter = useCallback(
    (parentId: string, branch: 'next' | 'yes' | 'no', newStep: AutomationStep) => {
      setTriggers((prevTriggers) => {
        setSteps((prevSteps) => {
          const result = insertStepAfter(prevTriggers, prevSteps, parentId, branch, newStep);
          // We need to set triggers from within this callback to keep them in sync
          // Using a ref-based approach instead
          return result.steps;
        });
        // Also update triggers
        const result = insertStepAfter(prevTriggers, steps, parentId, branch, newStep);
        return result.triggers;
      });
      markDirty();
    },
    [steps, markDirty]
  );

  const addStepAfterSync = useCallback(
    (parentId: string, branch: 'next' | 'yes' | 'no', newStep: AutomationStep) => {
      const result = insertStepAfter(triggers, steps, parentId, branch, newStep);
      setTriggers(result.triggers);
      setSteps(result.steps);
      markDirty();
    },
    [triggers, steps, markDirty]
  );

  const updateStepById = useCallback(
    (id: string, patch: Partial<AutomationStep>) => {
      setSteps((prev) => updateStep(prev, id, patch));
      markDirty();
    },
    [markDirty]
  );

  const removeStepById = useCallback(
    (id: string) => {
      setSteps((prev) => removeStep(prev, id));
      setTriggers((prev) => removeStepFromTriggers(prev, id));
      if (selectedStepId === id) setSelectedStepId(null);
      markDirty();
    },
    [selectedStepId, markDirty]
  );

  return {
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
  };
}
