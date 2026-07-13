import { makeId, SubscriptionId, TransactionId } from "@delulu/core";
import { epochToDate, epochToDateOr } from "../idmap";
import type {
  LegacySubscription,
  LegacyTransaction,
  LegacyUser,
} from "../legacy";
import type { TransformContext } from "./context";
import { COUNTER } from "./counters";

const isActive = (s: LegacySubscription): boolean => s.status === "ACTIVE";
const isAddon = (s: LegacySubscription): boolean => s.type === "addon";
const periodStart = (s: LegacySubscription): number =>
  s.currentPeriodStart ?? s._creationTime;

export interface BillingInput {
  readonly users: readonly LegacyUser[];
  readonly subscriptions: readonly LegacySubscription[];
  readonly transactions: readonly LegacyTransaction[];
}

/**
 * One subscriptions row per user (billing owner): the plan named by
 * `subscriptionId`, else the latest active non-addon, else a synthesized FREE
 * row (#8). Usage counters carry over; addons fold into the `addons` jsonb;
 * unselected historical rows are dropped (transactions keep the history).
 */
export const transformBilling = (
  ctx: TransformContext,
  input: BillingInput
): void => {
  const subsByUser = new Map<string, LegacySubscription[]>();
  const subById = new Map<string, LegacySubscription>();
  for (const sub of input.subscriptions) {
    subById.set(sub._id, sub);
    const list = subsByUser.get(sub.userId) ?? [];
    list.push(sub);
    subsByUser.set(sub.userId, list);
  }

  for (const user of input.users) {
    const billingOwnerUserId = ctx.userIdByLegacy.get(user._id);
    if (billingOwnerUserId === undefined) {
      continue;
    }
    const subs = subsByUser.get(user._id) ?? [];
    const addons = subs.filter(isAddon);

    let selected: LegacySubscription | undefined;
    if (user.subscriptionId !== undefined) {
      selected = subById.get(user.subscriptionId);
    }
    if (selected === undefined) {
      selected = subs
        .filter((s) => !isAddon(s) && isActive(s))
        .sort((a, b) => periodStart(b) - periodStart(a))[0];
    }
    if (selected === undefined) {
      ctx.counters.bump(COUNTER.subscriptionsFreeSynthesized);
    }
    const droppedHistorical = subs.length - (selected ? 1 : 0) - addons.length;
    if (droppedHistorical > 0) {
      ctx.counters.bump(
        COUNTER.subscriptionsHistoricalDropped,
        droppedHistorical
      );
    }

    const usage = user.usage ?? {};
    const addonsJson: Record<string, unknown> = {};
    for (const addon of addons) {
      addonsJson[addon.addonType ?? addon._id] = {
        status: addon.status.toLowerCase(),
        providerSubscriptionId: addon.dodoSubscriptionId ?? null,
        legacyConvexId: addon._id,
      };
    }

    ctx.load.subscriptions.push({
      id: makeId(SubscriptionId),
      legacyConvexId: selected?._id ?? null,
      billingOwnerUserId,
      providerCustomerId:
        selected?.dodoCustomerId ?? user.dodoCustomerId ?? null,
      providerSubscriptionId: selected?.dodoSubscriptionId ?? null,
      plan: (selected?.planType ?? "FREE").toLowerCase(),
      status: (selected?.status ?? "ACTIVE").toLowerCase(),
      currentPeriodStart:
        epochToDate(selected?.currentPeriodStart) ??
        epochToDate(usage.monthlyPostsPeriodStart),
      currentPeriodEnd: epochToDate(selected?.currentPeriodEnd),
      monthlyPosts: usage.monthlyPosts ?? 0,
      mediaStorageBytes: usage.mediaStorageBytes ?? 0,
      dmsSent: usage.dmsSent ?? 0,
      dmsSkipped: 0,
      transcriptionsUsed: usage.transcriptionsUsed ?? 0,
      transcriptionsPeriodStart: epochToDate(usage.transcriptionPeriodStart),
      dmsSentPeriodStart: null,
      dmsReserved: 0,
      socialAccounts: usage.socialAccounts ?? 0,
      apiRequestsPerMonth: 0,
      apiRequestsPeriodStart: null,
      addons: JSON.stringify(addonsJson),
      seatQuantity: null,
      unitPriceMinor: null,
      createdAt: epochToDateOr(
        selected?._creationTime ?? user._creationTime,
        user._creationTime
      ),
      updatedAt: epochToDateOr(user.updatedAt, user._creationTime),
    });
  }

  // Transactions: straight copy, dedupe on provider payment id.
  const seenPayment = new Set<string>();
  for (const txn of input.transactions) {
    const billingOwnerUserId = ctx.userIdByLegacy.get(txn.userId);
    if (billingOwnerUserId === undefined) {
      ctx.warnings.push(
        `transactions/${txn._id}: user ${txn.userId} not migrated — dropped`
      );
      continue;
    }
    if (seenPayment.has(txn.dodoPaymentId)) {
      ctx.counters.bump(COUNTER.transactionsDuplicateDropped);
      continue;
    }
    seenPayment.add(txn.dodoPaymentId);

    const metadata: Record<string, unknown> = {};
    if (txn.description !== undefined) {
      metadata.description = txn.description;
    }
    if (txn.receiptUrl !== undefined) {
      metadata.receiptUrl = txn.receiptUrl;
    }
    if (txn.invoiceUrl !== undefined) {
      metadata.invoiceUrl = txn.invoiceUrl;
    }
    if (txn.failureReason !== undefined) {
      metadata.failureReason = txn.failureReason;
    }
    if (txn.subscriptionId !== undefined) {
      metadata.legacySubscriptionId = txn.subscriptionId;
    }
    if (txn.metadata !== undefined) {
      metadata.legacyMetadata = txn.metadata;
    }
    if (txn.paidAt !== undefined) {
      metadata.paidAt = txn.paidAt;
    }

    ctx.load.transactions.push({
      id: makeId(TransactionId),
      legacyConvexId: txn._id,
      billingOwnerUserId,
      providerTransactionId: txn.dodoPaymentId,
      amountMinor: txn.amount,
      currency: txn.currency,
      status: txn.status.toLowerCase(),
      metadata: JSON.stringify(metadata),
      createdAt: epochToDateOr(
        txn.paidAt ?? txn._creationTime,
        txn._creationTime
      ),
      updatedAt: epochToDateOr(txn.updatedAt, txn._creationTime),
    });
  }
};
