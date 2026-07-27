import { PROD_PRODUCT_IDS, PROD_PRODUCT_IDS_INR } from "@delulu/payments";
import DodoPayments from "dodopayments";
import { Effect, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";

export const RECOVERY_CAMPAIGN = {
  id: "migration-recovery-2026-07",
  eventName: "migrationRecoveryOffer",
  discountCode: "DELULU2MONTHS",
  discountName: "Migration recovery — two months free",
  bookingUrl: "https://cal.com/swaraj/retention",
  billingUrl: "https://solulu.delulu.social/billing",
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
  readonly optedOut: number;
  readonly missingOrInvalidEmail: number;
}

export interface RecoveryCampaignLaunch {
  readonly preview: RecoveryCampaignPreview;
  readonly discountId: string;
  readonly discountCode: string;
  readonly enqueued: number;
}

export class RecoveryCampaignError extends Schema.TaggedErrorClass<RecoveryCampaignError>()(
  "RecoveryCampaignError",
  {
    message: Schema.String,
  }
) {}

const asCount = (value: number | string | bigint | undefined): number =>
  Number(value ?? 0);

export const recoveryCampaignPreview = Effect.fn("recoveryCampaignPreview")(
  function* (): Effect.fn.Return<
    RecoveryCampaignPreview,
    never,
    SqlClient.SqlClient
  > {
    const sql = yield* SqlClient.SqlClient;
    const rows = yield* sql<{
      totalSignups: number | string | bigint;
      eligibleRecipients: number | string | bigint;
      alreadyQueued: number | string | bigint;
      sentRecipients: number | string | bigint;
      pendingRecipients: number | string | bigint;
      failedRecipients: number | string | bigint;
      deadRecipients: number | string | bigint;
      optedOut: number | string | bigint;
      missingOrInvalidEmail: number | string | bigint;
    }>`
      WITH incident_signups AS (
        SELECT
          u.id,
          u.email,
          COALESCE(p.product_lifecycle_enabled, true) AS lifecycle_enabled,
          (
            u.email IS NOT NULL
            AND btrim(u.email) ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
            AND lower(u.email) NOT LIKE '%@example.com'
            AND lower(u.email) NOT LIKE '%@test.com'
          ) AS has_valid_email
        FROM users u
        LEFT JOIN email_preferences p ON p.user_id = u.id
        WHERE u.created_at >= ${new Date(RECOVERY_CAMPAIGN.startsAt)}
          AND u.created_at <= ${new Date(RECOVERY_CAMPAIGN.endsAt)}
      )
      SELECT
        count(*) AS total_signups,
        count(*) FILTER (
          WHERE lifecycle_enabled AND has_valid_email
        ) AS eligible_recipients,
        count(*) FILTER (
          WHERE lifecycle_enabled
            AND has_valid_email
            AND EXISTS (
              SELECT 1
              FROM message_deliveries d
              WHERE d.idempotency_key =
                ${`campaign:${RECOVERY_CAMPAIGN.id}:`} || incident_signups.id
            )
        ) AS already_queued,
        count(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM message_deliveries d
            WHERE d.idempotency_key =
              ${`campaign:${RECOVERY_CAMPAIGN.id}:`} || incident_signups.id
              AND d.status = 'sent'
          )
        ) AS sent_recipients,
        count(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM message_deliveries d
            WHERE d.idempotency_key =
              ${`campaign:${RECOVERY_CAMPAIGN.id}:`} || incident_signups.id
              AND d.status IN ('queued', 'leased')
          )
        ) AS pending_recipients,
        count(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM message_deliveries d
            WHERE d.idempotency_key =
              ${`campaign:${RECOVERY_CAMPAIGN.id}:`} || incident_signups.id
              AND d.status = 'failed'
          )
        ) AS failed_recipients,
        count(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM message_deliveries d
            WHERE d.idempotency_key =
              ${`campaign:${RECOVERY_CAMPAIGN.id}:`} || incident_signups.id
              AND d.status = 'dead'
          )
        ) AS dead_recipients,
        count(*) FILTER (
          WHERE NOT lifecycle_enabled AND has_valid_email
        ) AS opted_out,
        count(*) FILTER (WHERE NOT has_valid_email) AS missing_or_invalid_email
      FROM incident_signups
    `.pipe(Effect.orDie);
    const row = rows[0];
    const eligibleRecipients = asCount(row?.eligibleRecipients);
    const alreadyQueued = asCount(row?.alreadyQueued);
    return {
      campaignId: RECOVERY_CAMPAIGN.id,
      startsAt: RECOVERY_CAMPAIGN.startsAt,
      endsAt: RECOVERY_CAMPAIGN.endsAt,
      totalSignups: asCount(row?.totalSignups),
      eligibleRecipients,
      alreadyQueued,
      remainingRecipients: Math.max(0, eligibleRecipients - alreadyQueued),
      sentRecipients: asCount(row?.sentRecipients),
      pendingRecipients: asCount(row?.pendingRecipients),
      failedRecipients: asCount(row?.failedRecipients),
      deadRecipients: asCount(row?.deadRecipients),
      optedOut: asCount(row?.optedOut),
      missingOrInvalidEmail: asCount(row?.missingOrInvalidEmail),
    };
  }
);

export const recoveryDiscountSpec = (usageLimit: number) => ({
  amount: 10_000,
  code: RECOVERY_CAMPAIGN.discountCode,
  expires_at: RECOVERY_CAMPAIGN.expiresAt,
  name: RECOVERY_CAMPAIGN.discountName,
  restricted_to: productionMonthlyProductIds,
  subscription_cycles: RECOVERY_CAMPAIGN.offerMonths,
  type: "percentage" as const,
  usage_limit: usageLimit,
});

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      (
        ({
          '"': "&quot;",
          "&": "&amp;",
          "'": "&#039;",
          "<": "&lt;",
          ">": "&gt;",
        }) as const
      )[character as '"' | "&" | "'" | "<" | ">"]
  );

const WHITESPACE = /\s+/;

export const recoveryCampaignEmail = (rawFirstName: string | null) => {
  const firstName = rawFirstName?.trim().split(WHITESPACE)[0] || "there";
  const safeFirstName = escapeHtml(firstName);
  const expiry = "August 31, 2026";
  const subject = "We’re sorry — your next 2 months are on us";
  const text = `Hi ${firstName},

Over the past few weeks, our migration caused more bugs and errors than we consider acceptable. Since you joined during this period, you may not have received the experience we promised.

We’re genuinely sorry.

To make it right, we’d like to give you two months free. Visit ${RECOVERY_CAMPAIGN.billingUrl}, choose a monthly plan, and apply code ${RECOVERY_CAMPAIGN.discountCode} at checkout. The code is valid through ${expiry}.

If you experienced any issues—or would simply like help getting set up—we’re also happy to offer a complimentary one-on-one call: ${RECOVERY_CAMPAIGN.bookingUrl}

Thank you for giving us a chance, especially during a rough patch. We’re working hard to make Delulu faster, more reliable, and worthy of your trust.

— Swaraj
Delulu`;
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f6f6f6;color:#171717;font-family:Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">Two months free, plus a one-on-one setup call if you need it.</div>
    <main style="max-width:600px;margin:0 auto;padding:40px 20px">
      <div style="background:#ffffff;border:1px solid #e8e8e8;border-radius:16px;padding:36px">
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6">Hi ${safeFirstName},</p>
        <p style="margin:0 0 18px;font-size:16px;line-height:1.6">Over the past few weeks, our migration caused more bugs and errors than we consider acceptable. Since you joined during this period, you may not have received the experience we promised.</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6"><strong>We’re genuinely sorry.</strong></p>
        <p style="margin:0 0 18px;font-size:16px;line-height:1.6">To make it right, we’d like to give you <strong>two months free</strong>. Choose a monthly plan and apply this code at checkout:</p>
        <div style="margin:0 0 12px;padding:18px;text-align:center;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;font-size:22px;font-weight:700;letter-spacing:1px">${RECOVERY_CAMPAIGN.discountCode}</div>
        <p style="margin:0 0 24px;text-align:center;color:#666;font-size:13px">Valid through ${expiry}</p>
        <p style="margin:0 0 28px;text-align:center"><a href="${RECOVERY_CAMPAIGN.billingUrl}" style="display:inline-block;padding:13px 22px;background:#171717;color:#fff;text-decoration:none;border-radius:10px;font-weight:600">Claim two months free</a></p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6">If you experienced any issues—or would simply like help getting set up—we’re also happy to offer a <a href="${RECOVERY_CAMPAIGN.bookingUrl}" style="color:#5b21b6">complimentary one-on-one call</a>.</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6">Thank you for giving us a chance, especially during a rough patch. We’re working hard to make Delulu faster, more reliable, and worthy of your trust.</p>
        <p style="margin:0;font-size:16px;line-height:1.6">— Swaraj<br>Delulu</p>
      </div>
    </main>
  </body>
</html>`;
  return { html, subject, text };
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

export const isRecoveryDiscountCompatible = (
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
      let existing: RecoveryDiscount | undefined;
      for await (const discount of client.discounts.list({ page_size: 100 })) {
        if (discount.code === RECOVERY_CAMPAIGN.discountCode) {
          existing = discount;
          break;
        }
      }
      if (existing) {
        if (!isRecoveryDiscountCompatible(existing, usageLimit)) {
          throw new Error(
            `Discount ${RECOVERY_CAMPAIGN.discountCode} exists with incompatible settings`
          );
        }
        return existing;
      }
      return client.discounts.create(recoveryDiscountSpec(usageLimit));
    },
    catch: (cause) =>
      new RecoveryCampaignError({
        message:
          cause instanceof Error
            ? cause.message
            : "Unable to create or verify the Dodo discount",
      }),
  });

const enqueueRecoveryCampaign = Effect.fn("enqueueRecoveryCampaign")(function* (
  discountId: string
): Effect.fn.Return<number, never, SqlClient.SqlClient> {
  const sql = yield* SqlClient.SqlClient;
  const idempotencyPrefix = `campaign:${RECOVERY_CAMPAIGN.id}:`;
  const recipients = yield* sql<{
    id: string;
    email: string;
    name: string | null;
  }>`
      SELECT u.id, btrim(u.email) AS email, u.name
      FROM users u
      LEFT JOIN email_preferences p ON p.user_id = u.id
      WHERE u.created_at >= ${new Date(RECOVERY_CAMPAIGN.startsAt)}
        AND u.created_at <= ${new Date(RECOVERY_CAMPAIGN.endsAt)}
        AND COALESCE(p.product_lifecycle_enabled, true)
        AND u.email IS NOT NULL
        AND btrim(u.email) ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
        AND lower(u.email) NOT LIKE '%@example.com'
        AND lower(u.email) NOT LIKE '%@test.com'
      ORDER BY u.created_at, u.id
    `.pipe(Effect.orDie);
  let enqueued = 0;
  for (const recipient of recipients) {
    const email = recoveryCampaignEmail(recipient.name);
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
          'cloudflare-loops',
          'queued',
          ${JSON.stringify({
            kind: "transactional",
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
    readonly environment: "test_mode" | "live_mode";
  }): Effect.fn.Return<
    RecoveryCampaignLaunch,
    RecoveryCampaignError,
    SqlClient.SqlClient
  > {
    const preview = yield* recoveryCampaignPreview();
    if (preview.eligibleRecipients === 0) {
      return yield* new RecoveryCampaignError({
        message: "No eligible recipients were found in the incident window",
      });
    }
    const discount = yield* ensureRecoveryDiscount(
      config,
      preview.eligibleRecipients
    );
    const enqueued = yield* enqueueRecoveryCampaign(discount.discount_id);
    return {
      preview,
      discountId: discount.discount_id,
      discountCode: discount.code,
      enqueued,
    };
  }
);
