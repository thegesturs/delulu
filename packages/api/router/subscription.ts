import { api } from "@delulu/database/convex/_generated/api";
import { fetchQuery } from "@delulu/database/server";
import {
  ALL_TRY_DELULU_PRODUCT_IDS,
  getAllProductIds,
} from "@delulu/payments/product-ids";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { createDodoClient } from "../lib/dodo";
import { protectedProcedure } from "../trpc";

/** Product IDs users are allowed to switch to (all regular plan IDs, no Try Delulu) */
const ALLOWED_SWITCH_PRODUCT_IDS = new Set(getAllProductIds());

export const subscriptionRouter = {
  changePlan: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Block switching to Try Delulu or unknown product IDs
      if (
        !ALLOWED_SWITCH_PRODUCT_IDS.has(input.productId) ||
        ALL_TRY_DELULU_PRODUCT_IDS.includes(
          input.productId as (typeof ALL_TRY_DELULU_PRODUCT_IDS)[number]
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid target product",
        });
      }

      const subscription = await fetchQuery(
        api.subscriptions.getCurrentSubscription,
        {},
        { token: ctx.token }
      );

      if (!subscription || subscription.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active subscription found",
        });
      }

      if (!subscription.dodoSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subscription has no Dodo subscription ID",
        });
      }

      const dodo = createDodoClient();

      await dodo.subscriptions.changePlan(subscription.dodoSubscriptionId, {
        product_id: input.productId,
        proration_billing_mode: "prorated_immediately",
        quantity: 1,
      });

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
