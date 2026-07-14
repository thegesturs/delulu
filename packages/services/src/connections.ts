import {
  type ConnectionUpsertInput,
  connectFacebookPage,
  getConnection,
} from "@delulu/connections";
import {
  ConflictError,
  type ConnectionView,
  NotFoundError,
} from "@delulu/contracts";
import {
  type AuthContext,
  ConnectionId,
  makeId,
  TokenCipher,
  type WorkspaceId,
} from "@delulu/core";
import { Context, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { AutomationKvNamespace } from "./automation-kv";
import { LifecycleService } from "./lifecycle";

type ConnectionOutput = typeof ConnectionView.Type;
const BASE64_PADDING = /=+$/;

export class ConnectionStateConfig extends Context.Service<
  ConnectionStateConfig,
  { readonly secret: string }
>()("@delulu/services/ConnectionStateConfig") {}

export interface VerifiedConnectionState {
  readonly workspaceId: string;
  readonly principal: string;
  readonly nonce: string;
  readonly issuedAt: number;
}

const base64Url = (bytes: Uint8Array): string => {
  let value = "";
  for (const byte of bytes) {
    value += String.fromCharCode(byte);
  }
  return btoa(value)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(BASE64_PADDING, "");
};
const sign = async (secret: string, value: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return base64Url(new Uint8Array(digest).slice(0, 16));
};
const equal = (left: string, right: string): boolean => {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    // biome-ignore lint/suspicious/noBitwiseOperators: constant-time comparison
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
};

export class ConnectionStateService extends Context.Service<
  ConnectionStateService,
  {
    readonly mint: (
      workspaceId: string,
      auth: AuthContext
    ) => Effect.Effect<string, ConflictError>;
    readonly verify: (
      state: string
    ) => Effect.Effect<VerifiedConnectionState, ConflictError>;
  }
>()("@delulu/services/ConnectionStateService") {
  static readonly layer = Layer.effect(
    ConnectionStateService,
    Effect.gen(function* () {
      const config = yield* ConnectionStateConfig;
      const mint = (workspaceId: string, auth: AuthContext) =>
        Effect.tryPromise({
          try: async () => {
            if (!config.secret) {
              throw new Error("missing secret");
            }
            const principal = auth.apiKeyId
              ? `k:${auth.apiKeyId}`
              : `u:${auth.userId}`;
            const nonce = base64Url(crypto.getRandomValues(new Uint8Array(16)));
            const value = `${workspaceId}.${principal}.${nonce}.${Math.floor(Date.now() / 1000)}`;
            return `${value}.${await sign(config.secret, value)}`;
          },
          catch: () =>
            new ConflictError({
              message: "Connection state signing is unavailable",
              resource: "connection",
            }),
        });
      const verify = (state: string) =>
        Effect.tryPromise({
          try: async () => {
            const parts = state.split(".");
            if (parts.length !== 5) {
              throw new Error("bad state");
            }
            const [workspaceId, principal, nonce, issued, signature] =
              parts as [string, string, string, string, string];
            const value = `${workspaceId}.${principal}.${nonce}.${issued}`;
            const expected = await sign(config.secret, value);
            const issuedAt = Number(issued);
            if (
              !(equal(signature, expected) && Number.isFinite(issuedAt)) ||
              Math.abs(Date.now() / 1000 - issuedAt) > 600
            ) {
              throw new Error("expired or invalid state");
            }
            return { workspaceId, principal, nonce, issuedAt };
          },
          catch: () =>
            new ConflictError({
              message: "Connection state is invalid or expired",
              resource: "connection",
            }),
        });
      return ConnectionStateService.of({ mint, verify });
    })
  );
}

const toOutput = (row: Record<string, unknown>): ConnectionOutput => ({
  id: String(row.id),
  platform: String(row.platform),
  profileId: String(row.profileId),
  username: row.username === null ? null : String(row.username),
  displayName: row.displayName === null ? null : String(row.displayName),
  expiresAt:
    row.expiresAt === null
      ? null
      : new Date(row.expiresAt as Date | string).toISOString(),
});

export class ConnectionsService extends Context.Service<
  ConnectionsService,
  {
    readonly list: (
      workspaceId: WorkspaceId,
      limit: number,
      offset: number
    ) => Effect.Effect<{
      data: readonly ConnectionOutput[];
      total: number;
      limit: number;
      offset: number;
    }>;
    readonly remove: (
      workspaceId: WorkspaceId,
      id: string
    ) => Effect.Effect<void, NotFoundError>;
    readonly mint: (
      workspaceId: WorkspaceId,
      platform: string,
      auth: AuthContext,
      includeInsights?: boolean
    ) => Effect.Effect<
      { url: string; expiresIn: number },
      ConflictError | NotFoundError
    >;
    readonly upsertFromOAuth: (
      workspaceId: WorkspaceId,
      input: ConnectionUpsertInput
    ) => Effect.Effect<
      "created" | "updated" | "transfer_required",
      ConflictError
    >;
    readonly handleCallback: (input: {
      readonly platform: string;
      readonly code: string | null;
      readonly error: string | null;
      readonly errorReason: string | null;
      readonly state: string;
    }) => Effect.Effect<Response, ConflictError | NotFoundError>;
    readonly confirmTransfer: (input: {
      readonly connectionId: string;
      readonly sourceWorkspaceId: WorkspaceId;
      readonly destinationWorkspaceId: WorkspaceId;
    }) => Effect.Effect<void, NotFoundError>;
    readonly completeFacebook: (input: {
      readonly state: string;
      readonly code: string;
      readonly pageId: string;
      readonly pageName: string;
    }) => Effect.Effect<{ status: "connected" | "transferred" }, ConflictError>;
  }
>()("@delulu/services/ConnectionsService") {
  static readonly layer = Layer.effect(
    ConnectionsService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const lifecycle = yield* LifecycleService;
      const states = yield* ConnectionStateService;
      const cipher = yield* TokenCipher;
      const temporaryStore = yield* AutomationKvNamespace;
      const list = Effect.fn("ConnectionsService.list")(function* (
        workspaceId: WorkspaceId,
        limit: number,
        offset: number
      ) {
        const rows = yield* sql<
          Record<string, unknown>
        >`SELECT id, platform, profile_id, username, display_name, expires_at
          FROM connections WHERE workspace_id = ${workspaceId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`.pipe(
          Effect.orDie
        );
        const totals = yield* sql<{
          count: string;
        }>`SELECT count(*)::text AS count FROM connections WHERE workspace_id = ${workspaceId}`.pipe(
          Effect.orDie
        );
        return {
          data: rows.map(toOutput),
          total: Number(totals[0]?.count ?? 0),
          limit,
          offset,
        };
      });
      const remove = Effect.fn("ConnectionsService.remove")(function* (
        workspaceId: WorkspaceId,
        id: string
      ) {
        const rows = yield* sql<{
          id: string;
        }>`DELETE FROM connections WHERE id = ${id} AND workspace_id = ${workspaceId} RETURNING id`.pipe(
          Effect.orDie
        );
        if (rows.length === 0) {
          return yield* new NotFoundError({
            message: "Connection not found",
            resource: "connection",
          });
        }
        yield* lifecycle.syncWorkspace({
          workspaceId,
          event: "social_account_disconnected",
          idempotencyKey: `connection-deleted:${id}`,
        });
      });
      const mint = Effect.fn("ConnectionsService.mint")(function* (
        workspaceId: WorkspaceId,
        platform: string,
        auth: AuthContext,
        includeInsights?: boolean
      ) {
        let connection: ReturnType<typeof getConnection>;
        try {
          connection = getConnection(
            platform.toUpperCase() as Parameters<typeof getConnection>[0]
          );
        } catch {
          return yield* new NotFoundError({
            message: "Platform not found",
            resource: "platform",
          });
        }
        const state = yield* states.mint(workspaceId, auth);
        return {
          url: connection.auth.getConnectUrl({ state, includeInsights }),
          expiresIn: 600,
        };
      });
      const upsertFromOAuth = Effect.fn("ConnectionsService.upsertFromOAuth")(
        function* (workspaceId: WorkspaceId, input: ConnectionUpsertInput) {
          const existing = yield* sql<
            Record<string, unknown>
          >`SELECT id, workspace_id FROM connections
          WHERE platform = ${input.socialType} AND profile_id = ${input.profileId}`.pipe(
            Effect.orDie
          );
          const row = existing[0];
          if (row && row.workspaceId !== workspaceId) {
            return "transfer_required" as const;
          }
          const access = yield* cipher.encrypt(input.accessToken).pipe(
            Effect.mapError(
              () =>
                new ConflictError({
                  message: "Unable to encrypt connection token",
                  resource: "connection",
                })
            )
          );
          const refresh = input.refreshToken
            ? yield* cipher.encrypt(input.refreshToken).pipe(
                Effect.mapError(
                  () =>
                    new ConflictError({
                      message: "Unable to encrypt refresh token",
                      resource: "connection",
                    })
                )
              )
            : null;
          const metadata = {
            profileImage: input.profileImage,
            refreshTokenExpiresIn: input.refreshTokenExpiresIn,
            ...input.metadata,
          };
          if (row) {
            yield* sql`UPDATE connections SET access_token = ${access.ciphertext},
            refresh_token = ${refresh?.ciphertext ?? null}, expires_at = ${input.expiresIn ? new Date(input.expiresIn) : null},
            username = ${input.username ?? null}, display_name = ${input.fullName ?? null},
            metadata = ${JSON.stringify(metadata)}::jsonb WHERE id = ${String(row.id)}`.pipe(
              Effect.orDie
            );
            yield* lifecycle.syncWorkspace({ workspaceId });
            return "updated" as const;
          }
          yield* sql`INSERT INTO connections
          (id, workspace_id, platform, profile_id, username, display_name, access_token, refresh_token,
           cipher_version, expires_at, metadata)
          VALUES (${makeId(ConnectionId)}, ${workspaceId}, ${input.socialType}, ${input.profileId},
            ${input.username ?? null}, ${input.fullName ?? null}, ${access.ciphertext}, ${refresh?.ciphertext ?? null},
            'v1', ${input.expiresIn ? new Date(input.expiresIn) : null}, ${JSON.stringify(metadata)}::jsonb)`.pipe(
            Effect.orDie
          );
          yield* lifecycle.syncWorkspace({
            workspaceId,
            event:
              input.socialType.toLowerCase() === "instagram"
                ? "instagram_connected"
                : "social_account_connected",
            idempotencyKey: `connection-created:${input.socialType}:${input.profileId}`,
          });
          return "created" as const;
        }
      );
      const handleCallback = Effect.fn("ConnectionsService.handleCallback")(
        function* (input: {
          readonly platform: string;
          readonly code: string | null;
          readonly error: string | null;
          readonly errorReason: string | null;
          readonly state: string;
        }) {
          const verified = yield* states.verify(input.state);
          let connection: ReturnType<typeof getConnection>;
          try {
            connection = getConnection(
              input.platform.toUpperCase() as Parameters<
                typeof getConnection
              >[0]
            );
          } catch {
            return yield* new NotFoundError({
              message: "Platform not found",
              resource: "platform",
            });
          }
          return yield* Effect.tryPromise({
            try: () =>
              connection.auth.handleCallback({
                code: input.code,
                error: input.error,
                errorReason: input.errorReason,
                state: input.state,
                userId: verified.principal,
                temporaryStore,
                upsert: (value) =>
                  Effect.runPromise(
                    upsertFromOAuth(verified.workspaceId as WorkspaceId, value)
                  ),
              }),
            catch: () =>
              new ConflictError({
                message: "Connection callback failed",
                resource: "connection",
              }),
          });
        }
      );
      const confirmTransfer = Effect.fn("ConnectionsService.confirmTransfer")(
        function* (input: {
          readonly connectionId: string;
          readonly sourceWorkspaceId: WorkspaceId;
          readonly destinationWorkspaceId: WorkspaceId;
        }) {
          const rows = yield* sql<{ id: string }>`UPDATE connections
          SET workspace_id = ${input.destinationWorkspaceId}
          WHERE id = ${input.connectionId} AND workspace_id = ${input.sourceWorkspaceId}
          RETURNING id`.pipe(Effect.orDie);
          if (rows.length === 0) {
            return yield* new NotFoundError({
              message: "Source connection not found",
              resource: "connection",
            });
          }
        }
      );
      const completeFacebook = Effect.fn("ConnectionsService.completeFacebook")(
        function* (input: {
          state: string;
          code: string;
          pageId: string;
          pageName: string;
        }) {
          const verified = yield* states.verify(input.state);
          return yield* Effect.tryPromise({
            try: () =>
              connectFacebookPage({
                code: input.code,
                pageId: input.pageId,
                pageName: input.pageName,
                externalId: verified.principal,
                temporaryStore,
                upsert: (value) =>
                  Effect.runPromise(
                    upsertFromOAuth(verified.workspaceId as WorkspaceId, value)
                  ),
              }),
            catch: () =>
              new ConflictError({
                message: "Facebook page connection failed",
                resource: "connection",
              }),
          });
        }
      );
      return ConnectionsService.of({
        list,
        remove,
        mint,
        upsertFromOAuth,
        handleCallback,
        confirmTransfer,
        completeFacebook,
      });
    })
  );
}
