import { Api, Authentication } from "@delulu/contracts";
import { Context, Effect, Layer } from "effect";
import { FetchHttpClient, HttpClientRequest } from "effect/unstable/http";
import { HttpApiClient, HttpApiMiddleware } from "effect/unstable/httpapi";
import { runEffect } from "./effect.js";

export interface ApiClientConfig {
  readonly baseUrl: string;
  readonly getToken: () => string | Promise<string>;
}

export type ApiClient = HttpApiClient.ForApi<typeof Api>;

export class ApiClientService extends Context.Service<
  ApiClientService,
  ApiClient
>()("@delulu/client/ApiClientService") {
  static readonly layer = (client: ApiClient) =>
    Layer.succeed(ApiClientService, client);
}

export interface ResolveWorkspaceIdOptions {
  readonly client: ApiClient;
  readonly workspaceId?: string;
}

export const resolveWorkspaceId = async ({
  client,
  workspaceId,
}: ResolveWorkspaceIdOptions): Promise<string> => {
  if (workspaceId) {
    return workspaceId;
  }
  const memberships = await runEffect(client.me.workspaces());
  const firstWorkspaceId = memberships.data[0]?.workspaceId;
  if (!firstWorkspaceId) {
    throw new Error(
      "No workspace is available. Set DELULU_WORKSPACE_ID or create a workspace first."
    );
  }
  return firstWorkspaceId;
};

const tokenError = (cause: unknown) =>
  cause instanceof Error
    ? cause
    : new Error("Failed to get an API access token", { cause });

/**
 * Create the contract-derived Effect client. Token lookup happens for every
 * request so refreshable browser, CLI, and MCP credentials never go stale.
 */
export const createApiClient = ({
  baseUrl,
  getToken,
}: ApiClientConfig): ApiClient => {
  const AuthenticationClient = HttpApiMiddleware.layerClient(
    Authentication,
    Effect.fn("Authentication.client")(function* ({ next, request }) {
      const token = yield* Effect.tryPromise({
        try: () => Promise.resolve(getToken()),
        catch: tokenError,
      }).pipe(Effect.orDie);

      return yield* next(HttpClientRequest.bearerToken(request, token));
    })
  );

  return Effect.runSync(
    HttpApiClient.make(Api, { baseUrl }).pipe(
      Effect.provide(AuthenticationClient),
      Effect.provide(FetchHttpClient.layer)
    )
  );
};
