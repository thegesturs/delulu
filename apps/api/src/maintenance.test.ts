import { describe, expect, it } from "vitest";
import { maintenanceResponse } from "./maintenance";

describe("API cutover maintenance", () => {
  it.each([
    undefined,
    "false",
    "",
  ])("does not affect normal traffic (%s)", (flag) => {
    expect(
      maintenanceResponse(new Request("https://api.test/v1/posts"), flag)
    ).toBeNull();
  });

  it.each([
    "/v1/posts",
    "/v1/connections/callback/linkedin?code=test",
    "/health",
    "/internal/jobs/",
    "/internal/jobs/other",
  ])("blocks %s without invoking application handlers", async (path) => {
    const response = maintenanceResponse(
      new Request(`https://api.test${path}`),
      "true"
    );
    expect(response?.status).toBe(503);
    expect(response?.headers.get("retry-after")).toBe("60");
    expect(response?.headers.get("cache-control")).toBe("no-store");
    expect(await response?.json()).toEqual({
      error: "maintenance",
      message:
        "The API is temporarily paused for maintenance. Please retry shortly.",
    });
  });

  it("leaves the exact transfer endpoint to its existing authentication handler", () => {
    expect(
      maintenanceResponse(
        new Request("https://api.test/internal/jobs", { method: "POST" }),
        "true"
      )
    ).toBeNull();
  });
});
