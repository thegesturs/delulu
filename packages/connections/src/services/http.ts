import { Duration, Effect } from "effect";
import { fromUnknownHttp, networkError } from "../errors";

/**
 * `fetch` with a timeout, as an Effect. Isomorphic — uses the global `fetch`
 * (available on Node 20+ and workerd), so this helper is safe on both runtimes.
 * The publish path uses axios; connect/callback/webhook/query paths use this.
 */
export const fetchEffect = (
  provider: string,
  url: string,
  init?: RequestInit,
  timeoutMs = 15_000
): Effect.Effect<Response, ReturnType<typeof networkError>> =>
  Effect.tryPromise({
    try: (signal) => fetch(url, { ...init, signal }),
    catch: () => networkError(provider, "fetch"),
  }).pipe(
    Effect.timeoutFail({
      duration: Duration.millis(timeoutMs),
      onTimeout: () => networkError(provider, "fetch timeout"),
    })
  );

/** Fetch + parse JSON, failing with a classified `ConnectionError` on !ok. */
export const fetchJson = <T>(
  provider: string,
  url: string,
  init?: RequestInit,
  timeoutMs = 15_000
): Effect.Effect<T, ReturnType<typeof fromUnknownHttp>> =>
  Effect.gen(function* () {
    const response = yield* fetchEffect(provider, url, init, timeoutMs);
    if (!response.ok) {
      const body = yield* Effect.promise(() => response.text().catch(() => ""));
      return yield* Effect.fail(
        fromUnknownHttp(provider, {
          response: { status: response.status, data: { message: body } },
        })
      );
    }
    return yield* Effect.tryPromise({
      try: () => response.json() as Promise<T>,
      catch: (e) => fromUnknownHttp(provider, e),
    });
  });
