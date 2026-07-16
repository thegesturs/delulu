import { describe, expect, it } from "vitest";
import { signCalendarWebhook, verifyCalendarWebhook } from "./calendar-webhook";

describe("calendar webhook verification", () => {
  it("accepts the raw body signature and rejects a changed body", async () => {
    const body = JSON.stringify({ triggerEvent: "BOOKING_CREATED" });
    const signature = await signCalendarWebhook(body, "test-secret");
    await expect(
      verifyCalendarWebhook(body, signature, "test-secret")
    ).resolves.toBe(true);
    await expect(
      verifyCalendarWebhook(`${body} `, signature, "test-secret")
    ).resolves.toBe(false);
  });
});
