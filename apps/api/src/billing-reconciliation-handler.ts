import { Effect } from "effect";
import { handleBillingReconciliationJob } from "../../../packages/services/src/billing-reconciliation";

/** Scheduler adapter for the M4 billing reconciliation job payload. */
export const billingReconciliationHandler = Effect.fn(
  "billingReconciliationHandler"
)(function* (payload: { readonly billingOwnerUserId?: string }) {
  return yield* handleBillingReconciliationJob(payload);
});
