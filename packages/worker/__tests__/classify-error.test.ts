import { describe, expect, it } from "vitest";
import {
  APIError,
  classifyError,
  InvalidAccessTokenError,
  NetworkError,
  RateLimitError,
} from "../providers/errors";

describe("classifyError", () => {
  it("marks network/rate-limit/5xx as TRANSIENT", () => {
    expect(classifyError(new NetworkError("X", "publish")).errorClass).toBe(
      "TRANSIENT"
    );
    expect(classifyError(new RateLimitError("X", 60)).errorClass).toBe(
      "TRANSIENT"
    );
    expect(classifyError(new APIError("X", 503)).errorClass).toBe("TRANSIENT");
  });

  it("marks auth errors and 4xx as PERMANENT", () => {
    expect(classifyError(new InvalidAccessTokenError("X")).errorClass).toBe(
      "PERMANENT"
    );
    expect(classifyError(new APIError("X", 400)).errorClass).toBe("PERMANENT");
  });

  it("carries the provider error code", () => {
    expect(classifyError(new RateLimitError("X")).errorCode).toBe(
      "RATE_LIMIT_EXCEEDED"
    );
  });

  it("treats unknown errors as TRANSIENT so blips retry", () => {
    const c = classifyError(new Error("boom"));
    expect(c.errorClass).toBe("TRANSIENT");
    expect(c.errorCode).toBe("UNKNOWN_ERROR");
    expect(c.errorMessage).toBe("boom");
  });
});
