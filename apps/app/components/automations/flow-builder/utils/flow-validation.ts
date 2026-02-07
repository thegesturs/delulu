import type { AutomationStep, TriggerStep } from './flow-types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validate step-based flow for completeness before activation.
 */
export function validateFlow(
  triggers: TriggerStep[],
  steps: AutomationStep[]
): ValidationResult {
  const errors: string[] = [];

  // 1. At least 1 trigger
  if (triggers.length === 0) {
    errors.push('At least one trigger is required');
  }

  // 2. Every trigger must have at least 1 target post
  for (const trigger of triggers) {
    if (trigger.targetPostIds.length === 0) {
      errors.push('Each trigger must have at least one target post selected');
      break;
    }
  }

  // 3. At least 1 Send DM step
  const sendDmSteps = steps.filter((s) => s.type === 'send_dm');
  if (sendDmSteps.length === 0) {
    errors.push('Flow must have at least one Send DM step');
  }

  // 4. All Send DM steps must have a message
  for (const step of sendDmSteps) {
    if (step.type === 'send_dm' && !step.messageTemplate.trim()) {
      errors.push('All Send DM steps must have a message');
      break;
    }
  }

  // 5. URL buttons must have valid URLs and titles
  for (const step of sendDmSteps) {
    if (step.type !== 'send_dm' || !step.buttons) {
      continue;
    }
    for (const btn of step.buttons) {
      if (!btn.title.trim()) {
        errors.push('All DM buttons must have a title');
        break;
      }
      if (btn.type === 'url' && 'url' in btn && !isValidUrl(btn.url ?? '')) {
        errors.push(
          'URL buttons must have a valid URL (e.g. https://example.com)'
        );
        break;
      }
    }
    if (errors.length > 0) {
      break;
    }
  }

  // 6. Every trigger must lead to at least one Send DM (reachability)
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  for (const trigger of triggers) {
    if (!trigger.nextStepId) {
      errors.push('Every trigger must be connected to at least one step');
      break;
    }
    const reachable = getReachableSteps(trigger.nextStepId, stepMap);
    const hasSendDm = reachable.some((id) => {
      const s = stepMap.get(id);
      return s?.type === 'send_dm';
    });
    if (!hasSendDm) {
      errors.push('Every trigger must lead to a Send DM step');
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}

function getReachableSteps(
  startId: string,
  stepMap: Map<string, AutomationStep>
): string[] {
  const visited = new Set<string>();
  const stack = [startId];

  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) {
      continue;
    }
    visited.add(id);

    const step = stepMap.get(id);
    if (!step) {
      continue;
    }

    if (step.type === 'condition') {
      if (step.yesStepId) {
        stack.push(step.yesStepId);
      }
      if (step.noStepId) {
        stack.push(step.noStepId);
      }
    } else if (step.type === 'send_dm' && step.nextStepId) {
      stack.push(step.nextStepId);
    }
  }

  return [...visited];
}
