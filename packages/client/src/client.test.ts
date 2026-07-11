import { NotFoundError } from "@delulu/contracts";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createApiClient } from "./client.js";
import { runEffect } from "./effect.js";

const fetchMock = vi.fn();

describe("createApiClient", () => {
  beforeAll(() => vi.stubGlobal("fetch", fetchMock));
  beforeEach(() => fetchMock.mockReset());
  afterAll(() => vi.unstubAllGlobals());

  it("derives routes from the contract and gets a fresh token per request", async () => {
    fetchMock.mockImplementation(async () =>
      Response.json(
        {
          user: {
            id: "usr_1",
            externalId: "external_1",
            email: "person@example.com",
            name: "Person",
            imageUrl: null,
          },
          personalWorkspace: null,
        },
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    let tokenCount = 0;
    const client = createApiClient({
      baseUrl: "https://api.example.com",
      getToken: () => `token-${++tokenCount}`,
    });

    await runEffect(client.me.current());
    await runEffect(client.me.current());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0].toString()).toBe(
      "https://api.example.com/v1/me"
    );
    expect(
      new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("authorization")
    ).toBe("Bearer token-1");
    expect(
      new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("authorization")
    ).toBe("Bearer token-2");
  });

  it("decodes declared API errors as their tagged class", async () => {
    fetchMock.mockImplementation(async () =>
      Response.json(
        {
          error: {
            code: "NotFoundError",
            message: "Missing post",
            details: { resource: "post" },
          },
        },
        { status: 404, headers: { "content-type": "application/json" } }
      )
    );
    const client = createApiClient({
      baseUrl: "https://api.example.com",
      getToken: () => "token",
    });

    await expect(
      runEffect(
        client.posts.get({ params: { workspaceId: "wrk_1", id: "post_1" } })
      )
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
