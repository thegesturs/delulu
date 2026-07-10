import { Effect, Schema } from "effect";
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

export const JsonObject = Schema.Record(Schema.String, Schema.Unknown);
export const BigIntValue = Schema.BigIntFromString;
