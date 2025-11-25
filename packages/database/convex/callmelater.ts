'use node';

import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';

const CALLMELATER_API_URL = 'https://api.callmelater.xyz';

/**
 * CallMeLater API response types
 */
type CallMeLaterScheduleResponse = {
  scheduleId: string;
};

/**
 * Schedule a post to be published at a specific time using CallMeLater API
 */
export const schedulePostAction = internalAction({
  args: {
    postId: v.id('posts'),
    scheduledAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiKey = process.env.CALLMELATER_API_KEY;
    const convexSiteUrl = process.env.CONVEX_SITE_URL;

    if (!apiKey) {
      throw new Error('CALLMELATER_API_KEY environment variable is not set');
    }

    if (!convexSiteUrl) {
      throw new Error('CONVEX_SITE_URL environment variable is not set');
    }

    try {
      const response = await fetch(`${CALLMELATER_API_URL}/schedule`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUrl: `${convexSiteUrl}/publishPost`,
          targetMethod: 'POST',
          targetHeaders: {
            'Content-Type': 'application/json',
          },
          targetBody: {
            postId: args.postId,
          },
          triggerAt: new Date(args.scheduledAt).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to schedule post with CallMeLater: ${response.status} ${errorText}`
        );
      }

      const result = (await response.json()) as CallMeLaterScheduleResponse;
      const scheduleId = result.scheduleId;

      // Save the scheduleId to the post using an internal mutation
      await ctx.runMutation(internal.posts.saveCallMeLaterScheduleId, {
        postId: args.postId,
        scheduleId,
      });
    } catch (error) {
      console.error('Error scheduling post with CallMeLater:', error);
      throw error;
    }
  },
});

/**
 * Cancel a scheduled post using CallMeLater API
 */
export const cancelScheduleAction = internalAction({
  args: {
    scheduleId: v.string(),
  },
  returns: v.boolean(),
  handler: async (_ctx, args) => {
    const apiKey = process.env.CALLMELATER_API_KEY;

    if (!apiKey) {
      throw new Error('CALLMELATER_API_KEY environment variable is not set');
    }

    try {
      const response = await fetch(`${CALLMELATER_API_URL}/schedule/cancel`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: args.scheduleId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to cancel schedule with CallMeLater: ${response.status} ${errorText}`
        );
        // Don't throw error - post might already be published or schedule doesn't exist
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error canceling schedule with CallMeLater:', error);
      // Don't throw error - we want the mutation to continue even if cancel fails
      return false;
    }
  },
});
