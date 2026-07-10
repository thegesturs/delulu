import {
  Effect,
  Option,
  Schema,
  SchemaIssue,
  SchemaTransformation,
} from "effect";
import { Model } from "effect/unstable/schema";
import { SqlModel } from "effect/unstable/sql";

export const entityFields = <S extends Schema.Top>(id: S) => ({
  id: Model.GeneratedByApp(id),
  legacyConvexId: Schema.NullOr(Schema.String),
  createdAt: Model.DateTimeInsertFromDate,
  updatedAt: Model.DateTimeUpdateFromDate,
});

export const domainErrorFields = {
  message: Schema.String,
  retryable: Schema.Boolean,
};

export const repository = Effect.fn("repository")(
  <
    M extends Model.Any,
    Id extends keyof M["Type"] & keyof M["update"]["Type"] & keyof M["fields"],
  >(
    model: M,
    idColumn: Id,
    tableName: string,
    spanPrefix: string
  ) => SqlModel.makeRepository(model, { tableName, idColumn, spanPrefix })
);

/**
 * JSONB-backed field for node-pg.
 *
 * Encodes to a JSON string so top-level arrays are not sent as Postgres array
 * literals (`[]` → `{}`). Decodes from either a JSON string or an
 * already-parsed value (default node-pg jsonb parser).
 */
export const JsonColumn = <S extends Schema.Top>(schema: S) =>
  Schema.Unknown.pipe(
    Schema.decodeTo(
      schema,
      SchemaTransformation.transformOrFail({
        decode: (input) => {
          try {
            const value = typeof input === "string" ? JSON.parse(input) : input;
            return Effect.succeed(value);
          } catch (cause) {
            return Effect.fail(
              new SchemaIssue.InvalidValue(Option.some(input), {
                message: cause instanceof Error ? cause.message : String(cause),
              })
            );
          }
        },
        encode: (value) => {
          try {
            return Effect.succeed(JSON.stringify(value));
          } catch (cause) {
            return Effect.fail(
              new SchemaIssue.InvalidValue(Option.some(value), {
                message: cause instanceof Error ? cause.message : String(cause),
              })
            );
          }
        },
      })
    )
  );

export const JsonObject = JsonColumn(
  Schema.Record(Schema.String, Schema.Unknown)
);
export const BigIntValue = Schema.BigIntFromString;
