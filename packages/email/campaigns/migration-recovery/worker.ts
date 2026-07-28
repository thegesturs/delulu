import { Effect } from "effect";
import {
  launchRecoveryCampaign,
  recoveryCampaignEmailApproval,
  recoveryCampaignPreview,
} from "./campaign";

const BOOKING_URL = "https://cal.com/swaraj";
const APPROVED_EMAIL_FINGERPRINT = "78078fab7f28a3c3";
const LAUNCH_EXPIRES_AT = new Date("2026-07-29T18:29:59.999Z");

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
