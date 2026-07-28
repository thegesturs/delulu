import { createHash } from "node:crypto";
import { PROD_PRODUCT_IDS, PROD_PRODUCT_IDS_INR } from "@delulu/payments";
import DodoPayments, { APIError } from "dodopayments";
import { Effect, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { renderMigrationRecoveryEmail } from "../../renderers/migration-recovery";

export const RECOVERY_CAMPAIGN = {
  id: "migration-recovery-2026-07",
  eventName: "migrationRecoveryOffer",
  emailFromAddress: "welcome@mail.delulu.social",
  emailFromName: "Delulu Social",
  discountCode: "DELULU2MONTHS",
  discountName: "Migration recovery — two months free",
  billingUrl: "https://solulu.delulu.social/billing",
  preferencesUrl: "https://solulu.delulu.social/workspace",
  startsAt: "2026-07-05T18:30:00.000Z",
  endsAt: "2026-07-27T18:29:59.999Z",
  expiresAt: "2026-08-31T23:59:59.999Z",
  offerMonths: 2,
} as const;

const productionMonthlyProductIds = [
  ...new Set([
    ...Object.values(PROD_PRODUCT_IDS).map(({ monthly }) => monthly),
    ...Object.values(PROD_PRODUCT_IDS_INR).map(({ monthly }) => monthly),
  ]),
].sort();

const productionBaseProductIds = new Set([
  ...Object.values(PROD_PRODUCT_IDS).flatMap(({ monthly, yearly }) => [
    monthly,
    yearly,
  ]),
  ...Object.values(PROD_PRODUCT_IDS_INR).flatMap(({ monthly, yearly }) => [
    monthly,
    yearly,
  ]),
]);

export interface RecoveryCampaignPreview {
  readonly campaignId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly totalSignups: number;
  readonly eligibleRecipients: number;
  readonly alreadyQueued: number;
  readonly remainingRecipients: number;
  readonly sentRecipients: number;
  readonly pendingRecipients: number;
  readonly failedRecipients: number;
  readonly deadRecipients: number;
  readonly failureReasons: readonly string[];
  readonly activeSubscribers: number;
  readonly optedOut: number;
  readonly missingOrInvalidEmail: number;
}

export interface RecoveryCampaignLaunch {
  readonly preview: RecoveryCampaignPreview;
  readonly discountId: string;
  readonly discountCode: string;
  readonly extendedSubscriptions: number;
  readonly enqueued: number;
}

export interface RecoveryCampaignEmailApproval {
  readonly approval: string;
  readonly bookingUrl: string;
  readonly discountCode: string;
  readonly expiresOn: string;
  readonly from: string;
  readonly subject: string;
}

export class RecoveryCampaignError extends Schema.TaggedErrorClass<RecoveryCampaignError>()(
  "RecoveryCampaignError",
  {
    message: Schema.String,
    retryable: Schema.Boolean,
  }
) {}

interface RecoveryCampaignAudienceMember {
  readonly id: string;
  readonly email: string | null;
  readonly name: string | null;
  readonly lifecycleEnabled: boolean;
  readonly deliveryStatus: string | null;
  readonly deliveryLastError: string | null;
  readonly activeSubscription: boolean;
  readonly currentPeriodEnd: Date | null;
  readonly plan: string | null;
  readonly providerCustomerId: string | null;
  readonly providerSubscriptionId: string | null;
}

const EMAIL_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasDeliverableEmail = (
  member: RecoveryCampaignAudienceMember
): member is RecoveryCampaignAudienceMember & { readonly email: string } => {
  const email = member.email?.trim().toLowerCase();
  return Boolean(
    email &&
      EMAIL_ADDRESS.test(email) &&
      !email.endsWith("@example.com") &&
      !email.endsWith("@test.com")
  );
};

const loadRecoveryCampaignAudience = Effect.fn("loadRecoveryCampaignAudience")(
  function* (): Effect.fn.Return<
    readonly RecoveryCampaignAudienceMember[],
    never,
    SqlClient.SqlClient
  > {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<RecoveryCampaignAudienceMember>`
      SELECT
        u.id,
        u.email,
        u.name,
        COALESCE(p.product_lifecycle_enabled, true) AS lifecycle_enabled,
        d.status AS delivery_status,
        d.last_error AS delivery_last_error,
        COALESCE(
          s.status IN ('active', 'trialing')
            AND upper(s.plan) IN ('ECHO', 'VIBE', 'COMMUNITY'),
          false
        ) AS active_subscription,
        s.current_period_end,
        s.plan,
        s.provider_customer_id,
        s.provider_subscription_id
      FROM users u
      LEFT JOIN email_preferences p ON p.user_id = u.id
      LEFT JOIN subscriptions s ON s.billing_owner_user_id = u.id
      LEFT JOIN message_deliveries d
        ON d.idempotency_key =
          ${`campaign:${RECOVERY_CAMPAIGN.id}:`} || u.id
      WHERE u.created_at >= ${new Date(RECOVERY_CAMPAIGN.startsAt)}
        AND u.created_at <= ${new Date(RECOVERY_CAMPAIGN.endsAt)}
      ORDER BY u.created_at, u.id
    `.pipe(Effect.orDie);
    return rows;
  }
);

const summarizeRecoveryCampaignAudience = (
  audience: readonly RecoveryCampaignAudienceMember[]
): RecoveryCampaignPreview => {
  const deliverable = audience.filter(hasDeliverableEmail);
  const eligible = deliverable.filter((member) => member.lifecycleEnabled);
  const alreadyQueued = eligible.filter(
    (member) => member.deliveryStatus !== null
  ).length;
  const failureReasons = [
    ...new Set(
      eligible
        .map((member) => member.deliveryLastError)
        .filter((reason): reason is string => Boolean(reason))
        .map((reason) =>
          reason.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]").slice(0, 500)
        )
    ),
  ];
  return {
    campaignId: RECOVERY_CAMPAIGN.id,
    startsAt: RECOVERY_CAMPAIGN.startsAt,
    endsAt: RECOVERY_CAMPAIGN.endsAt,
    totalSignups: audience.length,
    eligibleRecipients: eligible.length,
    alreadyQueued,
    remainingRecipients: Math.max(0, eligible.length - alreadyQueued),
    sentRecipients: eligible.filter(
      (member) => member.deliveryStatus === "sent"
    ).length,
    pendingRecipients: eligible.filter(
      (member) =>
        member.deliveryStatus === "queued" || member.deliveryStatus === "leased"
    ).length,
    failedRecipients: eligible.filter(
      (member) => member.deliveryStatus === "failed"
    ).length,
    deadRecipients: eligible.filter(
      (member) => member.deliveryStatus === "dead"
    ).length,
    failureReasons,
    activeSubscribers: eligible.filter((member) => member.activeSubscription)
      .length,
    optedOut: deliverable.filter((member) => !member.lifecycleEnabled).length,
    missingOrInvalidEmail: audience.length - deliverable.length,
  };
};

export const recoveryCampaignPreview = Effect.fn("recoveryCampaignPreview")(
  function* (): Effect.fn.Return<
    RecoveryCampaignPreview,
    never,
    SqlClient.SqlClient
  > {
    return summarizeRecoveryCampaignAudience(
      yield* loadRecoveryCampaignAudience()
    );
  }
);

const recoveryDiscountSpec = (usageLimit: number) => ({
  amount: 10_000,
  code: RECOVERY_CAMPAIGN.discountCode,
  expires_at: RECOVERY_CAMPAIGN.expiresAt,
  name: RECOVERY_CAMPAIGN.discountName,
  restricted_to: productionMonthlyProductIds,
  subscription_cycles: RECOVERY_CAMPAIGN.offerMonths,
  type: "percentage" as const,
  usage_limit: usageLimit,
});

const WHITESPACE = /\s+/;
const offerExpiresOn = "August 31, 2026";

export const recoveryCampaignEmailApproval = async (
  bookingUrl: string
): Promise<RecoveryCampaignEmailApproval> => {
  const common = {
    bookingUrl,
    firstName: "{{firstName}}",
    preferencesUrl: RECOVERY_CAMPAIGN.preferencesUrl,
  } as const;
  const discount = await renderMigrationRecoveryEmail({
    ...common,
    offer: {
      billingUrl: RECOVERY_CAMPAIGN.billingUrl,
      discountCode: RECOVERY_CAMPAIGN.discountCode,
      expiresOn: offerExpiresOn,
      kind: "discount",
    },
  });
  const extension = await renderMigrationRecoveryEmail({
    ...common,
    offer: { kind: "subscription-extension" },
  });
  const approval = createHash("sha256")
    .update(
      JSON.stringify({
        bookingUrl,
        discount,
        extension,
        from: `${RECOVERY_CAMPAIGN.emailFromName} <${RECOVERY_CAMPAIGN.emailFromAddress}>`,
      })
    )
    .digest("hex")
    .slice(0, 16);

  return {
    approval,
    bookingUrl,
    discountCode: RECOVERY_CAMPAIGN.discountCode,
    expiresOn: offerExpiresOn,
    from: `${RECOVERY_CAMPAIGN.emailFromName} <${RECOVERY_CAMPAIGN.emailFromAddress}>`,
    subject: discount.subject,
  };
};

interface RecoveryDiscount {
  readonly amount: number;
  readonly code: string;
  readonly discount_id: string;
  readonly expires_at?: string | null;
  readonly restricted_to: readonly string[];
  readonly subscription_cycles?: number | null;
  readonly type: string;
  readonly usage_limit?: number | null;
}

const isRecoveryDiscountCompatible = (
  discount: RecoveryDiscount,
  usageLimit: number
): boolean => {
  const expected = recoveryDiscountSpec(usageLimit);
  return (
    discount.code === expected.code &&
    discount.amount === expected.amount &&
    discount.type === expected.type &&
    discount.subscription_cycles === expected.subscription_cycles &&
    discount.usage_limit === expected.usage_limit &&
    new Date(discount.expires_at ?? 0).getTime() ===
      new Date(expected.expires_at).getTime() &&
    [...discount.restricted_to].sort().join(",") ===
      expected.restricted_to.join(",")
  );
};

const ensureRecoveryDiscount = (
  config: {
    readonly apiKey: string;
    readonly environment: "test_mode" | "live_mode";
  },
  usageLimit: number
) =>
  Effect.tryPromise({
    try: async () => {
      const client = new DodoPayments({
        bearerToken: config.apiKey,
        environment: config.environment,
      });
      const findExisting = async () => {
        for await (const discount of client.discounts.list({
          page_size: 100,
        })) {
          if (discount.code === RECOVERY_CAMPAIGN.discountCode) {
            return discount;
          }
        }
      };
      const existing = await findExisting();
      if (existing) {
        if (!isRecoveryDiscountCompatible(existing, usageLimit)) {
          const currentUsageLimit = existing.usage_limit;
          if (
            currentUsageLimit &&
            currentUsageLimit < usageLimit &&
            isRecoveryDiscountCompatible(existing, currentUsageLimit)
          ) {
            return client.discounts.update(
              existing.discount_id,
              { usage_limit: usageLimit },
              {
                headers: {
                  "idempotency-key": `campaign-discount-limit:${RECOVERY_CAMPAIGN.id}:${usageLimit}`,
                },
              }
            );
          }
          throw new Error(
            `Discount ${RECOVERY_CAMPAIGN.discountCode} exists with incompatible settings`
          );
        }
        return existing;
      }
      try {
        return await client.discounts.create(recoveryDiscountSpec(usageLimit), {
          headers: {
            "idempotency-key": `campaign-discount:${RECOVERY_CAMPAIGN.id}`,
          },
        });
      } catch (cause) {
        const concurrentlyCreated = await findExisting();
        if (
          concurrentlyCreated &&
          isRecoveryDiscountCompatible(concurrentlyCreated, usageLimit)
        ) {
          return concurrentlyCreated;
        }
        throw cause;
      }
    },
    catch: (cause) => {
      const retryable =
        cause instanceof APIError &&
        (cause.status === undefined ||
          cause.status === 429 ||
          cause.status >= 500);
      return new RecoveryCampaignError({
        message:
          cause instanceof Error
            ? cause.message
            : "Unable to create or verify the Dodo discount",
        retryable,
      });
    },
  });

const RECOVERY_EXTENSION_MARKER = "migration_recovery_2026_07";

interface ProviderSubscription {
  readonly customer: { readonly email: string };
  readonly metadata: Record<string, string>;
  readonly next_billing_date: string;
  readonly product_id: string;
  readonly subscription_id: string;
}

const addCalendarMonths = (isoDate: string, months: number): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Subscription has an invalid next billing date");
  }
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDayOfTargetMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
  return date.toISOString();
};

const extendActiveSubscriptions = (
  config: {
    readonly apiKey: string;
    readonly environment: "test_mode" | "live_mode";
  },
  audience: readonly RecoveryCampaignAudienceMember[]
) =>
  Effect.tryPromise({
    try: async () => {
      const client = new DodoPayments({
        bearerToken: config.apiKey,
        environment: config.environment,
      });
      const activeRecipients = audience
        .filter(hasDeliverableEmail)
        .filter(
          (member) => member.lifecycleEnabled && member.activeSubscription
        );
      let extended = 0;
      let providerSubscriptions: ProviderSubscription[] | undefined;
      for (const recipient of activeRecipients) {
        let subscription: ProviderSubscription | undefined;
        if (recipient.providerSubscriptionId) {
          subscription = await client.subscriptions.retrieve(
            recipient.providerSubscriptionId
          );
        } else {
          if (recipient.providerCustomerId) {
            const customerMatches: ProviderSubscription[] = [];
            for await (const candidate of client.subscriptions.list({
              customer_id: recipient.providerCustomerId,
              page_size: 100,
              status: "active",
            })) {
              customerMatches.push(candidate);
            }
            if (customerMatches.length === 1) {
              [subscription] = customerMatches;
            }
          }
          if (!providerSubscriptions) {
            providerSubscriptions = [];
            for await (const candidate of client.subscriptions.list({
              page_size: 100,
              status: "active",
            })) {
              if (productionBaseProductIds.has(candidate.product_id)) {
                providerSubscriptions.push(candidate);
              }
            }
          }
          if (!subscription) {
            const ownerMatches = providerSubscriptions.filter(
              (candidate) =>
                candidate.metadata.billing_owner_user_id === recipient.id
            );
            const emailMatches = providerSubscriptions.filter(
              (candidate) =>
                candidate.customer.email.trim().toLowerCase() ===
                recipient.email.trim().toLowerCase()
            );
            const matches =
              ownerMatches.length > 0 ? ownerMatches : emailMatches;
            if (matches.length !== 1) {
              throw new Error(
                `Unable to resolve one active provider subscription for user ${recipient.id} (plan=${recipient.plan ?? "unknown"}, currentPeriodEnd=${recipient.currentPeriodEnd?.toISOString() ?? "none"}, hasProviderCustomer=${Boolean(recipient.providerCustomerId)})`
              );
            }
            [subscription] = matches;
          }
        }
        if (!subscription) {
          throw new Error(
            `Unable to load the active provider subscription for user ${recipient.id}`
          );
        }
        if (subscription.metadata[RECOVERY_EXTENSION_MARKER] === "applied") {
          continue;
        }
        await client.subscriptions.update(
          subscription.subscription_id,
          {
            metadata: {
              ...subscription.metadata,
              [RECOVERY_EXTENSION_MARKER]: "applied",
            },
            next_billing_date: addCalendarMonths(
              subscription.next_billing_date,
              RECOVERY_CAMPAIGN.offerMonths
            ),
          },
          {
            headers: {
              "idempotency-key": `campaign-extension:${RECOVERY_CAMPAIGN.id}:${subscription.subscription_id}`,
            },
          }
        );
        extended += 1;
      }
      return extended;
    },
    catch: (cause) => {
      const retryable =
        cause instanceof APIError &&
        (cause.status === undefined ||
          cause.status === 429 ||
          cause.status >= 500);
      return new RecoveryCampaignError({
        message:
          cause instanceof Error
            ? cause.message
            : "Unable to extend active subscriptions",
        retryable,
      });
    },
  });

const enqueueRecoveryCampaign = Effect.fn("enqueueRecoveryCampaign")(function* (
  bookingUrl: string,
  discountId: string,
  audience: readonly RecoveryCampaignAudienceMember[]
): Effect.fn.Return<number, never, SqlClient.SqlClient> {
  const sql = yield* SqlClient.SqlClient;
  const idempotencyPrefix = `campaign:${RECOVERY_CAMPAIGN.id}:`;
  const recipients = audience
    .filter(hasDeliverableEmail)
    .filter((member) => member.lifecycleEnabled);
  let enqueued = 0;
  for (const recipient of recipients) {
    const firstName = recipient.name?.trim().split(WHITESPACE)[0] ?? "there";
    const offer = recipient.activeSubscription
      ? ({ kind: "subscription-extension" } as const)
      : ({
          billingUrl: RECOVERY_CAMPAIGN.billingUrl,
          discountCode: RECOVERY_CAMPAIGN.discountCode,
          expiresOn: offerExpiresOn,
          kind: "discount",
        } as const);
    const email = yield* Effect.promise(() =>
      renderMigrationRecoveryEmail({
        bookingUrl,
        firstName,
        offer,
        preferencesUrl: RECOVERY_CAMPAIGN.preferencesUrl,
      })
    );
    const rows = yield* sql<{ id: string }>`
        INSERT INTO message_deliveries (
          id,
          user_id,
          idempotency_key,
          channel,
          message_type,
          provider,
          status,
          payload,
          metadata
        )
        VALUES (
          ${`message_${crypto.randomUUID()}`},
          ${recipient.id},
          ${idempotencyPrefix + recipient.id},
          'transactional',
          ${RECOVERY_CAMPAIGN.eventName},
          'cloudflare-email',
          'queued',
          ${JSON.stringify({
            kind: "transactional",
            from: RECOVERY_CAMPAIGN.emailFromAddress,
            to: recipient.email,
            subject: email.subject,
            html: email.html,
            text: email.text,
          })}::jsonb,
          ${JSON.stringify({
            campaignId: RECOVERY_CAMPAIGN.id,
            discountId,
            incidentStartsAt: RECOVERY_CAMPAIGN.startsAt,
            incidentEndsAt: RECOVERY_CAMPAIGN.endsAt,
          })}::jsonb
        )
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id
      `.pipe(Effect.orDie);
    enqueued += rows.length;
  }
  return enqueued;
});

export const launchRecoveryCampaign = Effect.fn("launchRecoveryCampaign")(
  function* (config: {
    readonly apiKey: string;
    readonly bookingUrl: string;
    readonly environment: "test_mode" | "live_mode";
  }): Effect.fn.Return<
    RecoveryCampaignLaunch,
    RecoveryCampaignError,
    SqlClient.SqlClient
  > {
    const audience = yield* loadRecoveryCampaignAudience();
    const preview = summarizeRecoveryCampaignAudience(audience);
    if (preview.eligibleRecipients === 0) {
      return yield* new RecoveryCampaignError({
        message: "No eligible recipients were found in the incident window",
        retryable: false,
      });
    }
    const discountRecipients =
      preview.eligibleRecipients - preview.activeSubscribers;
    const discount = yield* ensureRecoveryDiscount(config, discountRecipients);
    const extendedSubscriptions = yield* extendActiveSubscriptions(
      config,
      audience
    );
    const enqueued = yield* enqueueRecoveryCampaign(
      config.bookingUrl,
      discount.discount_id,
      audience
    );
    return {
      preview,
      discountId: discount.discount_id,
      discountCode: discount.code,
      extendedSubscriptions,
      enqueued,
    };
  }
);
