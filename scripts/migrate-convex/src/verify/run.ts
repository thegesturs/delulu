import type { TokenCipher } from "@delulu/core";
import { Data, Effect } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { OUTPUT_DIR } from "../config";
import { readManifest } from "../manifest";
import { readSnapshot } from "../snapshot/reader";
import {
  checkOwnership,
  checkQuotaSeed,
  checkRoles,
  checkSampledEquality,
  checkTokens,
} from "./data-audit";
import {
  checkFkIntegrity,
  checkInvariants,
  checkRowCounts,
} from "./structural";
import type { AllowList, CheckResult } from "./types";

export class VerifyFailed extends Data.TaggedError("VerifyFailed")<{
  readonly failed: number;
}> {}

export interface VerifyOptions {
  readonly snapshotPath: string;
  readonly sampleSize: number;
  readonly allow: AllowList;
  readonly outputDir?: string;
}

/**
 * Run the full 8-check verification suite, print a single PASS/FAIL summary,
 * and fail (non-zero exit) if any check fails (spec §4.6).
 */
export const runVerify = (
  options: VerifyOptions
): Effect.Effect<
  readonly CheckResult[],
  VerifyFailed,
  SqlClient.SqlClient | TokenCipher
> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const snapshot = yield* readSnapshot(options.snapshotPath).pipe(
      Effect.orDie
    );
    const manifest = yield* readManifest(options.outputDir ?? OUTPUT_DIR).pipe(
      Effect.orDie
    );

    // A SQL/decoding failure inside a check aborts verification (defect).
    const results: CheckResult[] = [];
    results.push(
      yield* checkRowCounts(sql, snapshot, manifest).pipe(Effect.orDie)
    );
    results.push(yield* checkFkIntegrity(sql).pipe(Effect.orDie));
    results.push(yield* checkInvariants(sql).pipe(Effect.orDie));
    results.push(
      yield* checkSampledEquality(sql, snapshot, options.sampleSize).pipe(
        Effect.orDie
      )
    );
    results.push(yield* checkTokens(sql).pipe(Effect.orDie));
    results.push(
      yield* checkQuotaSeed(sql, manifest, options.allow).pipe(Effect.orDie)
    );
    results.push(yield* checkOwnership(sql, snapshot).pipe(Effect.orDie));
    results.push(yield* checkRoles(sql, snapshot).pipe(Effect.orDie));

    for (const result of results) {
      const header = `${result.pass ? "PASS" : "FAIL"} — ${result.name}`;
      const body =
        result.details.length > 0
          ? `\n    ${result.details.join("\n    ")}`
          : "";
      yield* Effect.log(`${header}${body}`);
    }
    const failed = results.filter((r) => !r.pass);
    yield* Effect.log(
      failed.length === 0
        ? `✔ ALL ${results.length} CHECKS PASSED`
        : `✖ ${failed.length}/${results.length} CHECK(S) FAILED`
    );
    if (failed.length > 0) {
      return yield* new VerifyFailed({ failed: failed.length });
    }
    return results;
  });
