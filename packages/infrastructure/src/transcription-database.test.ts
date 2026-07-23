import { describe, expect, it } from "vitest";
import { getTranscriptionDatabaseUrl } from "./transcription-database";

describe("transcription database configuration", () => {
  it("uses the runtime trust store when the provider requests system roots", () => {
    const url = new URL(
      getTranscriptionDatabaseUrl(
        "postgresql://user:password@database.example.com:5432/app?sslmode=verify-full&sslrootcert=system"
      )
    );

    expect(url.searchParams.get("sslmode")).toBe("verify-full");
    expect(url.searchParams.has("sslrootcert")).toBe(false);
  });
});
