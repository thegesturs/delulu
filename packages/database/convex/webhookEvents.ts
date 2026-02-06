import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import {
  webhookEventCreateSchema,
  webhookEventSchema,
  webhookEventStatusSchema,
  webhookEventUpdateSchema,
} from './schemas/automations';
import { getCurrentUser } from './users';
import { getCurrentTimestamp } from './utils';

// ============================================================================
// Queries
// ============================================================================

/**
 * Get webhook events (for debugging/admin)
 */
export const getWebhookEvents = query({
  args: {
    platform: v.optional(v.string()),
    status: v.optional(webhookEventStatusSchema),
    limit: v.optional(v.number()),
  },
  returns: v.array(webhookEventSchema),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    let eventsQuery;
    if (args.platform) {
      eventsQuery = ctx.db
        .query('webhookEvents')
        .withIndex('by_platform', (q) => q.eq('platform', args.platform!));
    } else if (args.status) {
      eventsQuery = ctx.db
        .query('webhookEvents')
        .withIndex('by_status', (q) => q.eq('status', args.status!));
    } else {
      eventsQuery = ctx.db
        .query('webhookEvents')
        .withIndex('by_received_at');
    }

    const events = await eventsQuery.order('desc').take(args.limit ?? 50);
    return events;
  },
});

/**
 * Get a webhook event by ID
 */
export const getByEventId = query({
  args: { eventId: v.string() },
  returns: v.union(webhookEventSchema, v.null()),
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query('webhookEvents')
      .withIndex('by_event_id', (q) => q.eq('eventId', args.eventId))
      .first();

    return event;
  },
});

// ============================================================================
// Mutations (called by Lambda processor and HTTP handler)
// ============================================================================

/**
 * Create a webhook event record
 */
export const createWebhookEvent = mutation({
  args: webhookEventCreateSchema.fields,
  returns: v.id('webhookEvents'),
  handler: async (ctx, args) => {
    const now = getCurrentTimestamp();

    const eventId = await ctx.db.insert('webhookEvents', {
      eventId: args.eventId,
      platform: args.platform,
      eventType: args.eventType,
      rawPayload: args.rawPayload,
      status: args.status ?? 'RECEIVED',
      retryCount: args.retryCount ?? 0,
      receivedAt: now,
    });

    return eventId;
  },
});

/**
 * Update webhook event status by event ID
 */
export const updateByEventId = mutation({
  args: {
    eventId: v.string(),
    ...webhookEventUpdateSchema.fields,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query('webhookEvents')
      .withIndex('by_event_id', (q) => q.eq('eventId', args.eventId))
      .first();

    if (!event) {
      return false;
    }

    const { eventId, ...updateData } = args;

    await ctx.db.patch(event._id, updateData);
    return true;
  },
});

/**
 * Increment retry count for a webhook event
 */
export const incrementRetryCount = mutation({
  args: { eventId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query('webhookEvents')
      .withIndex('by_event_id', (q) => q.eq('eventId', args.eventId))
      .first();

    if (!event) {
      return false;
    }

    await ctx.db.patch(event._id, {
      retryCount: event.retryCount + 1,
    });

    return true;
  },
});
