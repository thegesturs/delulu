import { describe, expect, it } from "vitest";
import { networkSettings } from "./daytona-execution-workspace";

describe("execution workspace network policy", () => {
  it("blocks all egress for isolated tasks", () => {
    expect(networkSettings("none")).toEqual({ networkBlockAll: true });
  });

  it("fails closed when an approved-domain policy has no domains", () => {
    expect(networkSettings("approved_domains", [])).toEqual({
      networkBlockAll: true,
    });
    expect(networkSettings("approved_domains", ["example.com"])).toEqual({
      domainAllowList: "example.com",
    });
    expect(
      networkSettings("approved_domains", ["example.com,evil.test"])
    ).toEqual({
      networkBlockAll: true,
    });
  });

  it("labels unrestricted egress explicitly", () => {
    expect(networkSettings("public_network")).toEqual({});
  });
});
