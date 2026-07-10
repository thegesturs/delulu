import { Effect, Schedule } from "effect";
import { SqlClient, SqlError } from "effect/unstable/sql";

const retryableCodes = new Set(["40001", "40P01"]);

const postgresCode = (error: unknown): string | undefined => {
  const candidates = [
    error,
    (error as { cause?: unknown })?.cause,
    (error as { reason?: unknown })?.reason,
  ];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && "code" in candidate) {
      const code = (candidate as { code?: unknown }).code;
      if (typeof code === "string") {
        return code;
      }
    }
  }
  return undefined;
};

export const isSerializableConflict = (error: unknown): boolean => {
  if (retryableCodes.has(postgresCode(error) ?? "")) {
    return true;
  }
  if (error instanceof SqlError.SqlError) {
    return retryableCodes.has(postgresCode(error.reason.cause) ?? "");
  }
  return false;
};

export const retrySerializable = Effect.fn("retrySerializable")(
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    effect.pipe(
      Effect.retry({
        while: isSerializableConflict,
        schedule: Schedule.exponential("25 millis").pipe(
          Schedule.jittered,
          Schedule.upTo({ times: 4 })
        ),
      })
    )
);

export const withSerializable = Effect.fn("withSerializable")(
  <A, E, R>(
    effect: Effect.Effect<A, E, R>
  ): Effect.Effect<A, E | SqlError.SqlError, R | SqlClient.SqlClient> =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      return yield* sql.withTransaction(
        sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`.pipe(
          Effect.andThen(effect)
        )
      );
    }).pipe(retrySerializable)
);
