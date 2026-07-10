import { SqlError } from "effect/unstable/sql";

const readCode = (candidate: unknown): string | undefined => {
  if (candidate && typeof candidate === "object" && "code" in candidate) {
    const code = (candidate as { code?: unknown }).code;
    if (typeof code === "string") {
      return code;
    }
  }
  return undefined;
};

/** Extract the underlying Postgres SQLSTATE code from any thrown SqlError. */
export const postgresCode = (error: unknown): string | undefined => {
  if (error instanceof SqlError.SqlError) {
    return (
      readCode(error.reason) ??
      readCode((error.reason as { cause?: unknown })?.cause)
    );
  }
  return readCode(error) ?? readCode((error as { cause?: unknown })?.cause);
};

/** `23505` — unique_violation. */
export const isUniqueViolation = (error: unknown): boolean =>
  postgresCode(error) === "23505";
