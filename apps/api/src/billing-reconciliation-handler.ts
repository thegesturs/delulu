import { handleBillingReconciliationJob } from "@delulu/services";
import { Effect } from "effect";

/** Scheduler adapter for the M4 billing reconciliation job payload. */
export const billingReconciliationHandler = Effect.fn(
  "billingReconciliationHandler"
)(function* (payload: { readonly billingOwnerUserId?: string }) {
  return yield* handleBillingReconciliationJob(payload);
});
