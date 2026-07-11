import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer } from "effect";
import { DatabaseUrl } from "./config";

/**
 * PgClient layer mirroring `packages/db/src/migrate.ts`: camel↔snake column
 * mapping and `transformJson` so top-level JSON round-trips through node-pg.
 */
export const PgLive = Layer.unwrap(
  Effect.map(DatabaseUrl, (url) =>
    PgClient.layer({
      url,
      transformQueryNames: EffectString.camelToSnake,
      transformResultNames: EffectString.snakeToCamel,
      transformJson: true,
    })
  )
);
