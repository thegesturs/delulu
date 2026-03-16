"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";
import type {
  AutomationStep,
  DelayStep,
  SendDmStep,
} from "./schemas/automations";

const CALLMELATER_API_URL = "https://api.callmelater.xyz";
const FREE_WATERMARK = "\n\n- - -\nSent via @delulu.social";

// ============================================================================
// Public Action — called from Lambda to schedule via CallMeLater
// ============================================================================

/**
 * Public action callable from Lambda. Validates webhook secret, then
 * delegates to the internal scheduleDelayedDmAction.
 */
export const scheduleDelayedFollowup = action({
  args: {
    webhookSecret: v.string(),
    automationId: v.id("automations"),
    sessionId: v.id("automationSessions"),
    instagramUserId: v.string(),
    instagramAccountId: v.string(),
    resumeFromStepId: v.string(),
    delayMs: v.number(),
    variables: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.webhookSecret !== process.env.POSTING_SECRET_KEY) {
      throw new Error("Unauthorized");
    }

    await ctx.runAction(internal.scheduledDms.scheduleDelayedDmAction, {
      automationId: args.automationId,
      sessionId: args.sessionId,
      instagramUserId: args.instagramUserId,
      instagramAccountId: args.instagramAccountId,
      resumeFromStepId: args.resumeFromStepId,
      delayMs: args.delayMs,
      variables: args.variables,
    });

    return null;
  },
});

// ============================================================================
// Internal Schedule Action — calls CallMeLater
// ============================================================================

export const scheduleDelayedDmAction = internalAction({
  args: {
    automationId: v.id("automations"),
    sessionId: v.id("automationSessions"),
    instagramUserId: v.string(),
    instagramAccountId: v.string(),
    resumeFromStepId: v.string(),
    delayMs: v.number(),
    variables: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiKey = process.env.CALLMELATER_API_KEY;
    const convexSiteUrl = process.env.CONVEX_SITE_URL;

    if (!apiKey) {
      throw new Error("CALLMELATER_API_KEY environment variable is not set");
    }
    if (!convexSiteUrl) {
      throw new Error("CONVEX_SITE_URL environment variable is not set");
    }

    const triggerAt = new Date(Date.now() + args.delayMs).toISOString();

    try {
      const response = await fetch(`${CALLMELATER_API_URL}/schedule`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUrl: `${convexSiteUrl}/executeDelayedDm`,
          targetMethod: "POST",
          targetHeaders: {
            "Content-Type": "application/json",
          },
          targetBody: {
            automationId: args.automationId,
            sessionId: args.sessionId,
            instagramUserId: args.instagramUserId,
            instagramAccountId: args.instagramAccountId,
            resumeFromStepId: args.resumeFromStepId,
            variables: args.variables,
          },
          triggerAt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[scheduledDm] Failed to schedule with CallMeLater: ${response.status} ${errorText}`
        );
        return null;
      }

      const result = (await response.json()) as { scheduleId: string };
      console.log(
        `[scheduledDm] Scheduled delayed DM: scheduleId=${result.scheduleId}, triggerAt=${triggerAt}`
      );

      await ctx.runMutation(internal.automations.saveDelayScheduleId, {
        sessionId: args.sessionId,
        scheduleId: result.scheduleId,
      });
    } catch (error) {
      console.error("[scheduledDm] Error scheduling delayed DM:", error);
    }

    return null;
  },
});

// ============================================================================
// Execute Action — called by CallMeLater HTTP callback
// ============================================================================

export const executeDelayedDmAction = internalAction({
  args: {
    automationId: v.id("automations"),
    sessionId: v.id("automationSessions"),
    instagramUserId: v.string(),
    instagramAccountId: v.string(),
    resumeFromStepId: v.string(),
    variables: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log(
      `[delayedDm] Executing delayed DM: automation=${args.automationId}, step=${args.resumeFromStepId}`
    );

    // 1. Fetch automation
    const automation = await ctx.runQuery(
      internal.automations.getAutomationInternal,
      { automationId: args.automationId }
    );

    if (!automation?.isActive) {
      console.log(
        `[delayedDm] Automation ${args.automationId} not found or inactive`
      );
      return null;
    }

    // 2. Fetch provider data (access token)
    const providerData = await ctx.runQuery(
      internal.automations.getProviderDataInternal,
      { instagramAccountId: args.instagramAccountId }
    );

    if (!providerData) {
      console.log("[delayedDm] Could not load provider data");
      return null;
    }

    // 3. Find the step to execute
    const steps = automation.steps as AutomationStep[];
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    const rawStep = stepMap.get(args.resumeFromStepId);

    if (!rawStep || rawStep.type !== "send_dm") {
      console.log(
        `[delayedDm] Step ${args.resumeFromStepId} not found or not send_dm`
      );
      return null;
    }

    const step = rawStep as SendDmStep;

    // 4. Render message
    const variables = (args.variables as Record<string, string>) || {};
    let message = (step.messageTemplate || "").replace(
      /{(\w+)}/g,
      (match: string, key: string) => variables[key] ?? match
    );

    if (providerData.planType === "FREE") {
      message += FREE_WATERMARK;
    }

    // 5. Send voice note if present
    if (step.voiceNoteUrl) {
      const audioBody = {
        recipient: { id: args.instagramUserId },
        message: {
          attachment: {
            type: "audio",
            payload: { url: step.voiceNoteUrl },
          },
        },
      };

      const audioResponse = await fetch(
        `https://graph.instagram.com/v24.0/${providerData.profileId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${providerData.accessToken}`,
          },
          body: JSON.stringify(audioBody),
        }
      );

      if (!audioResponse.ok) {
        const data = (await audioResponse.json()) as {
          error?: { message?: string };
        };
        console.error("[delayedDm] Audio send failed:", data.error?.message);
        return null;
      }

      if (!message.trim() && (!step.buttons || step.buttons.length === 0)) {
        console.log("[delayedDm] Voice-only DM sent successfully");
        await handleNextStep(ctx, step.nextStepId, stepMap, args, providerData);
        return null;
      }
    }

    // 6. Build text + buttons body
    // biome-ignore lint/suspicious/noExplicitAny: Instagram API body varies
    const body: any = {
      recipient: { id: args.instagramUserId },
      message: { text: message },
    };

    const templateButtons: Record<string, string>[] = [];
    for (const btn of step.buttons ?? []) {
      if (templateButtons.length >= 3) {
        break;
      }
      if (btn.type === "quick_reply") {
        templateButtons.push({
          type: "postback",
          title: btn.title,
          payload: `${args.automationId}:${btn.payload || btn.title}`,
        });
      } else if (btn.type === "url") {
        templateButtons.push({
          type: "web_url",
          title: btn.title,
          url: btn.url,
        });
      }
    }

    if (templateButtons.length > 0) {
      body.message = {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: message,
            buttons: templateButtons,
          },
        },
      };
    }

    // 7. Send DM
    const response = await fetch(
      `https://graph.instagram.com/v24.0/${providerData.profileId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${providerData.accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const data = (await response.json()) as {
        error?: { message?: string };
      };
      console.error("[delayedDm] DM send failed:", data.error?.message);
      return null;
    }

    console.log(
      `[delayedDm] DM sent to ${args.instagramUserId} at step ${step.id}`
    );

    // 8. Record DM sent
    try {
      await ctx.runMutation(internal.automations.recordDMSentInternal, {
        userId: providerData.userId,
        automationId: args.automationId,
        sessionId: args.sessionId,
        stepId: step.id,
      });
    } catch (e) {
      console.error("[delayedDm] Failed to record DM:", e);
    }

    // 9. Check for next delay chain
    await handleNextStep(ctx, step.nextStepId, stepMap, args, providerData);

    return null;
  },
});

/**
 * After sending a delayed DM, check if the next step is another delay.
 * If so, schedule the next one. Otherwise mark session completed.
 */
async function handleNextStep(
  // biome-ignore lint/suspicious/noExplicitAny: convex action context
  ctx: any,
  nextStepId: string | undefined,
  stepMap: Map<string, AutomationStep>,
  args: {
    automationId: string;
    sessionId: string;
    instagramUserId: string;
    instagramAccountId: string;
    variables?: unknown;
  },
  // biome-ignore lint/suspicious/noExplicitAny: convex Id type
  providerData: { userId: any }
) {
  if (!nextStepId) {
    await ctx.runMutation(internal.automations.updateSessionInternal, {
      sessionId: args.sessionId,
      status: "completed",
    });
    return;
  }

  const nextStep = stepMap.get(nextStepId);
  if (!nextStep) {
    await ctx.runMutation(internal.automations.updateSessionInternal, {
      sessionId: args.sessionId,
      status: "completed",
    });
    return;
  }

  if (nextStep.type === "delay") {
    const delayStep = nextStep as DelayStep;
    const duration = delayStep.duration;
    const unit = delayStep.unit;
    let delayMs = duration * 60 * 1000;
    if (unit === "hours") {
      delayMs = duration * 60 * 60 * 1000;
    }
    if (unit === "days") {
      delayMs = duration * 24 * 60 * 60 * 1000;
    }

    const resumeFromStepId = delayStep.nextStepId;
    if (!resumeFromStepId) {
      await ctx.runMutation(internal.automations.updateSessionInternal, {
        sessionId: args.sessionId,
        status: "completed",
      });
      return;
    }

    await ctx.runAction(internal.scheduledDms.scheduleDelayedDmAction, {
      automationId: args.automationId,
      sessionId: args.sessionId,
      instagramUserId: args.instagramUserId,
      instagramAccountId: args.instagramAccountId,
      resumeFromStepId,
      delayMs,
      variables: args.variables,
    });
  } else {
    await ctx.runMutation(internal.automations.updateSessionInternal, {
      sessionId: args.sessionId,
      currentStepId: nextStepId,
    });
  }
}
