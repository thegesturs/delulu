import { describe, expect, it } from "vitest";
import { normalizePostgresUrl } from "./postgres-url";

describe("normalizePostgresUrl", () => {
  it("uses Node's trust store for provider URLs that specify the system roots", () => {
    const normalized = new URL(
      normalizePostgresUrl(
        "postgresql://user:password@database.example.com:5432/app?sslmode=verify-full&sslrootcert=system"
      )
    );

    expect(normalized.searchParams.get("sslmode")).toBe("verify-full");
    expect(normalized.searchParams.has("sslrootcert")).toBe(false);
  });

  it("preserves an explicit certificate path", () => {
    const normalized = new URL(
      normalizePostgresUrl(
        "postgresql://user:password@database.example.com:5432/app?sslrootcert=%2Fopt%2Fcerts%2Froot.pem"
      )
    );

    expect(normalized.searchParams.get("sslrootcert")).toBe(
      "/opt/certs/root.pem"
    );
  });
});
