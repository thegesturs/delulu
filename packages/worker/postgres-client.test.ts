import { describe, expect, it } from "vitest";
import { processPostgresMessage } from "./postgres-client";

describe("Postgres publish message boundary", () => {
  it("rejects malformed messages before opening a database transaction", async () => {
    await expect(processPostgresMessage("{}")).rejects.toThrow(
      "Invalid Postgres publish message"
    );
  });

  it("rejects structurally invalid identifiers at the queue boundary", async () => {
    await expect(
      processPostgresMessage(JSON.stringify({ jobId: 1, targetId: true }))
    ).rejects.toThrow("Invalid Postgres publish message");
  });
});
