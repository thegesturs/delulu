import { Effect } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { renderMigrationRecoveryEmail } from "../../renderers/migration-recovery";
import {
  launchRecoveryCampaign,
  RECOVERY_CAMPAIGN,
  recoveryCampaignEmailApproval,
  recoveryCampaignPreview,
} from "./campaign";

const BOOKING_URL = "https://cal.com/swaraj";
const APPROVED_EMAIL_FINGERPRINT = "78078fab7f28a3c3";
const LAUNCH_EXPIRES_AT = new Date("2026-07-29T18:29:59.999Z");
const EXPECTED_RECIPIENTS = 18;

export const renderRecoveryCampaignVerificationEmail = () =>
  renderMigrationRecoveryEmail({
    bookingUrl: BOOKING_URL,
    firstName: "Swaraj",
    offer: {
      discountCode: RECOVERY_CAMPAIGN.discountCode,
      expiresOn: "August 31, 2026",
      kind: "discount",
      onboardingUrl: RECOVERY_CAMPAIGN.onboardingUrl,
    },
    preferencesUrl: RECOVERY_CAMPAIGN.preferencesUrl,
  });

export const prepareRecoveryCampaignDeliveryVerification = Effect.fn(
  "prepareRecoveryCampaignDeliveryVerification"
)(function* () {
  const sql = yield* SqlClient.SqlClient;
  const idempotencyPrefix = "campaign:migration-recovery-2026-07:";
  return yield* sql.withTransaction(
    Effect.gen(function* () {
      const invalid = yield* sql<{ id: string }>`
        SELECT d.id
        FROM message_deliveries d
        INNER JOIN users u ON u.id = d.user_id
        WHERE d.idempotency_key LIKE ${`${idempotencyPrefix}%`}
          AND d.status = 'sent'
          AND d.provider_message_id IS NULL
        FOR UPDATE
      `.pipe(Effect.orDie);

      if (invalid.length === 0) {
        return { status: "already-prepared" } as const;
      }
      if (invalid.length !== EXPECTED_RECIPIENTS) {
        return yield* Effect.die(
          new Error(
            `Refusing recovery delivery reset: expected ${EXPECTED_RECIPIENTS} invalid rows, found ${invalid.length}`
          )
        );
      }

      const updated = yield* sql<{ id: string }>`
        UPDATE message_deliveries d
        SET
          status = 'suppressed',
          attempts = 0,
          next_attempt_at = now(),
          locked_until = NULL,
          sent_at = NULL,
          last_error = 'Held for explicit approval after Cloudflare delivery verification',
          provider_response = '{}'::jsonb
        FROM users u
        WHERE u.id = d.user_id
          AND d.idempotency_key LIKE ${`${idempotencyPrefix}%`}
          AND d.status = 'sent'
          AND d.provider_message_id IS NULL
        RETURNING d.id
      `.pipe(Effect.orDie);

      return {
        status: "prepared",
        held: updated.length,
      } as const;
    })
  );
});

export const runScheduledRecoveryCampaign = Effect.fn(
  "runScheduledRecoveryCampaign"
)(function* (config: {
  readonly apiKey: string;
  readonly environment: "live_mode";
  readonly now?: Date;
}) {
  if ((config.now ?? new Date()) > LAUNCH_EXPIRES_AT) {
    return { status: "expired" } as const;
  }

  const emailApproval = yield* Effect.promise(() =>
    recoveryCampaignEmailApproval(BOOKING_URL)
  );
  if (emailApproval.approval !== APPROVED_EMAIL_FINGERPRINT) {
    return yield* Effect.die(
      new Error("Recovery campaign email no longer matches its approval")
    );
  }

  const preview = yield* recoveryCampaignPreview();
  if (preview.remainingRecipients === 0) {
    return { status: "complete", preview } as const;
  }

  const launch = yield* launchRecoveryCampaign({
    apiKey: config.apiKey,
    bookingUrl: BOOKING_URL,
    environment: config.environment,
  });
  return { status: "launched", launch } as const;
});
