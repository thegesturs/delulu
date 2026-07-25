import {
  AutomationSessionCacheValue,
  type AutomationSessionId,
} from "@delulu/core/domain/automation-session";
import { AutomationId } from "@delulu/core/kernel/ids";
import { Context, Effect, Layer, Schema } from "effect";

export class AutomationKvError extends Schema.TaggedErrorClass<AutomationKvError>()(
  "AutomationKvError",
  { operation: Schema.String, key: Schema.String, message: Schema.String }
) {}

export interface WorkersKvNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

export class AutomationKvNamespace extends Context.Service<
  AutomationKvNamespace,
  WorkersKvNamespace
>()("@delulu/services/AutomationKvNamespace") {}

export const AutomationTriggerCacheValue = Schema.Struct({
  automationIds: Schema.Array(AutomationId),
});

export const triggerCacheKey = (profileId: string, mediaId: string) =>
  `automation:trigger:${profileId}:${mediaId}`;
export const allTriggerCacheKey = (profileId: string) =>
  `automation:trigger:${profileId}:*`;
export const sessionCacheKey = (profileId: string, platformUserId: string) =>
  `automation:session:${profileId}:${platformUserId}`;

export class AutomationKvService extends Context.Service<
  AutomationKvService,
  {
    readonly getTriggerIds: (
      profileId: string,
      mediaId: string
    ) => Effect.Effect<readonly AutomationId[] | null, AutomationKvError>;
    readonly putTriggerIds: (
      profileId: string,
      mediaId: string,
      automationIds: readonly AutomationId[]
    ) => Effect.Effect<void, AutomationKvError>;
    readonly getAllTriggerIds: (
      profileId: string
    ) => Effect.Effect<readonly AutomationId[] | null, AutomationKvError>;
    readonly putAllTriggerIds: (
      profileId: string,
      automationIds: readonly AutomationId[]
    ) => Effect.Effect<void, AutomationKvError>;
    readonly getSession: (
      profileId: string,
      platformUserId: string
    ) => Effect.Effect<AutomationSessionId | null, AutomationKvError>;
    readonly putSession: (input: {
      readonly profileId: string;
      readonly automationId: AutomationId;
      readonly platformUserId: string;
      readonly sessionId: AutomationSessionId;
    }) => Effect.Effect<void, AutomationKvError>;
    readonly removeSession: (
      profileId: string,
      platformUserId: string
    ) => Effect.Effect<void, AutomationKvError>;
  }
>()("@delulu/services/AutomationKvService") {
  static readonly layer = Layer.effect(
    AutomationKvService,
    Effect.gen(function* () {
      const kv = yield* AutomationKvNamespace;
      const read = Effect.fn("AutomationKvService.read")(function* <A>(
        key: string,
        schema: Schema.Decoder<A, never>
      ) {
        const raw = yield* Effect.tryPromise({
          try: () => kv.get(key),
          catch: () =>
            new AutomationKvError({
              operation: "get",
              key,
              message: "KV read failed",
            }),
        });
        if (raw === null) {
          return null;
        }
        return yield* Schema.decodeUnknownEffect(Schema.fromJsonString(schema))(
          raw
        ).pipe(
          Effect.mapError(
            () =>
              new AutomationKvError({
                operation: "decode",
                key,
                message: "KV value is invalid",
              })
          )
        );
      });
      const write = Effect.fn("AutomationKvService.write")(function* (
        key: string,
        value: unknown,
        expirationTtl?: number
      ) {
        yield* Effect.tryPromise({
          try: () =>
            kv.put(
              key,
              JSON.stringify(value),
              expirationTtl ? { expirationTtl } : undefined
            ),
          catch: () =>
            new AutomationKvError({
              operation: "put",
              key,
              message: "KV write failed",
            }),
        });
      });
      const remove = Effect.fn("AutomationKvService.remove")(function* (
        key: string
      ) {
        yield* Effect.tryPromise({
          try: () => kv.delete(key),
          catch: () =>
            new AutomationKvError({
              operation: "delete",
              key,
              message: "KV delete failed",
            }),
        });
      });
      const getTriggerIds = Effect.fn("AutomationKvService.getTriggerIds")(
        function* (profileId: string, mediaId: string) {
          const value = yield* read(
            triggerCacheKey(profileId, mediaId),
            AutomationTriggerCacheValue
          );
          return value?.automationIds ?? null;
        }
      );
      const putTriggerIds = Effect.fn("AutomationKvService.putTriggerIds")(
        function* (
          profileId: string,
          mediaId: string,
          automationIds: readonly AutomationId[]
        ) {
          const key = triggerCacheKey(profileId, mediaId);
          yield* automationIds.length === 0
            ? remove(key)
            : write(key, { automationIds });
        }
      );
      const getAllTriggerIds = Effect.fn(
        "AutomationKvService.getAllTriggerIds"
      )(function* (profileId: string) {
        const value = yield* read(
          allTriggerCacheKey(profileId),
          AutomationTriggerCacheValue
        );
        return value?.automationIds ?? null;
      });
      const putAllTriggerIds = Effect.fn(
        "AutomationKvService.putAllTriggerIds"
      )(function* (profileId: string, automationIds: readonly AutomationId[]) {
        yield* write(allTriggerCacheKey(profileId), { automationIds });
      });
      const getSession = Effect.fn("AutomationKvService.getSession")(function* (
        profileId: string,
        platformUserId: string
      ) {
        const value = yield* read(
          sessionCacheKey(profileId, platformUserId),
          AutomationSessionCacheValue
        );
        return value?.sessionId ?? null;
      });
      const putSession = Effect.fn("AutomationKvService.putSession")(
        function* (input: {
          readonly profileId: string;
          readonly automationId: AutomationId;
          readonly platformUserId: string;
          readonly sessionId: AutomationSessionId;
        }) {
          yield* write(
            sessionCacheKey(input.profileId, input.platformUserId),
            {
              sessionId: input.sessionId,
              automationId: input.automationId,
            },
            60 * 60 * 24
          );
        }
      );
      const removeSession = Effect.fn("AutomationKvService.removeSession")(
        (profileId: string, platformUserId: string) =>
          remove(sessionCacheKey(profileId, platformUserId))
      );
      return AutomationKvService.of({
        getTriggerIds,
        putTriggerIds,
        getAllTriggerIds,
        putAllTriggerIds,
        getSession,
        putSession,
        removeSession,
      });
    })
  );

  static readonly memoryLayer = (
    initial: Readonly<Record<string, string>> = {}
  ) => {
    const values = new Map(Object.entries(initial));
    return Layer.succeed(
      AutomationKvNamespace,
      AutomationKvNamespace.of({
        get: async (key) => values.get(key) ?? null,
        put: async (key, value) => {
          values.set(key, value);
        },
        delete: async (key) => {
          values.delete(key);
        },
      })
    );
  };
}
