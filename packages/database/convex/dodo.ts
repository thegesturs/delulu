/**
 * Dodo Payments Integration
 *
 * This file sets up the Dodo Payments component for handling:
 * - Customer identification
 * - Checkout sessions
 * - Customer portal
 * - Webhooks
 */

import { DodoPayments } from "@dodopayments/convex";
import { components, internal } from "./_generated/api";

/**
 * Initialize Dodo Payments with customer identification
 */
export const dodo: InstanceType<typeof DodoPayments> = new DodoPayments(
  components.dodopayments,
  {
    /**
     * Identify function - maps Convex user to Dodo Payments customer
     * This function is called automatically by Dodo to identify the current user
     */
    identify: async (ctx) => {
      // Get the authenticated user's identity from Clerk
      const identity = await ctx.auth.getUserIdentity();

      if (!identity) {
        console.log("[Dodo] No authenticated user found");
        return null; // User is not logged in
      }

      // Use internal query to fetch user from database
      // This uses the Clerk subject ID (externalId in our schema)
      const user = await ctx.runQuery(internal.users.getByExternalId, {
        externalId: identity.subject,
      });

      if (!user) {
        console.log("[Dodo] User not found in database:", identity.subject);
        return null; // User not found in database
      }

      console.log("[Dodo] Identified user:", user._id, user.email);

      // Return customer identification for Dodo Payments
      // If user already has a Dodo customer ID, return it
      // Otherwise, Dodo will create a new customer using customerData
      if (user.dodoCustomerId) {
        return {
          dodoCustomerId: user.dodoCustomerId,
        };
      }

      // No customer ID yet - Dodo will create one
      // Return null to let Dodo create a new customer
      return null;
    },
    // API configuration from environment variables
    // These should be set in the Convex dashboard
    apiKey: process.env.DODO_PAYMENTS_API_KEY!,
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT as
      | "test_mode"
      | "live_mode",
  }
);

/**
 * Export Dodo API methods for use in actions
 * These are exported as properties that access dodo.api() to avoid circular reference
 */
export const checkout = dodo.api().checkout;
export const customerPortal = dodo.api().customerPortal;
