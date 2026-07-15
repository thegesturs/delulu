import { parseScopes, SCOPES } from "@delulu/core";
import {
  AsTokenService,
  AuthConfig,
  ClerkTokenVerifier,
  DEVICE_GRANT_TYPE,
  IdentityService,
  OAuthFlowService,
} from "@delulu/services";
import { Effect } from "effect";
import {
  HttpRouter,
  type HttpServerRequest,
  HttpServerResponse,
} from "effect/unstable/http";

const jsonError = (error: string, description: string, status: number) =>
  HttpServerResponse.jsonUnsafe(
    { error, error_description: description },
    { status }
  );

const readBody = (
  request: HttpServerRequest.HttpServerRequest
): Effect.Effect<Record<string, string>> =>
  request.text.pipe(
    Effect.map((raw) => {
      const headers = request.headers as Record<string, string>;
      const contentType = headers["content-type"] ?? "";
      if (contentType.includes("application/json")) {
        try {
          return JSON.parse(raw) as Record<string, string>;
        } catch {
          return {};
        }
      }
      const fields: Record<string, string> = {};
      new URLSearchParams(raw).forEach((value, key) => {
        fields[key] = value;
      });
      return fields;
    }),
    Effect.orElseSucceed(() => ({}))
  );

const bearerFromHeaders = (
  request: HttpServerRequest.HttpServerRequest
): string | null => {
  const headers = request.headers as Record<string, string>;
  const header = headers.authorization ?? headers.Authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length);
};

/**
 * The OAuth 2.1 AS surface as plain router routes (its wire formats sit outside
 * the house HttpApi conventions). Services are captured once via `HttpRouter.use`
 * and closed over, so the handlers carry no per-request service requirement.
 */
export const OAuthRoutes = HttpRouter.use((router) =>
  Effect.gen(function* () {
    const config = yield* AuthConfig;
    const tokens = yield* AsTokenService;
    const clerk = yield* ClerkTokenVerifier;
    const identity = yield* IdentityService;
    const flow = yield* OAuthFlowService;
    const cache = { headers: { "cache-control": "public, max-age=3600" } };

    // RFC 8414 authorization-server metadata.
    yield* router.add(
      "GET",
      "/.well-known/oauth-authorization-server",
      Effect.succeed(
        HttpServerResponse.jsonUnsafe(
          {
            issuer: config.asIssuer,
            authorization_endpoint: `${config.asIssuer}/oauth/authorize`,
            token_endpoint: `${config.asIssuer}/oauth/token`,
            device_authorization_endpoint: `${config.asIssuer}/oauth/device/authorize`,
            revocation_endpoint: `${config.asIssuer}/oauth/revoke`,
            introspection_endpoint: `${config.asIssuer}/oauth/introspect`,
            jwks_uri: `${config.asIssuer}/.well-known/jwks.json`,
            response_types_supported: ["code"],
            grant_types_supported: [
              "authorization_code",
              "refresh_token",
              DEVICE_GRANT_TYPE,
            ],
            code_challenge_methods_supported: ["S256"],
            token_endpoint_auth_methods_supported: ["none"],
            scopes_supported: [...SCOPES],
            agent_auth: {
              skill: `${config.appBaseUrl}/auth.md`,
              device_authorization_endpoint: `${config.asIssuer}/oauth/device/authorize`,
            },
          },
          cache
        )
      )
    );

    yield* router.add("POST", "/oauth/device/authorize", (request) =>
      Effect.gen(function* () {
        const body = yield* readBody(request);
        const result = yield* flow
          .startDeviceAuthorization({
            clientId: body.client_id ?? "",
            scopes: parseScopes(body.scope),
            resource: body.resource ?? config.apiResource,
            verificationUri: `${config.appBaseUrl}/oauth/device`,
          })
          .pipe(Effect.result);
        return result._tag === "Failure"
          ? jsonError(
              result.failure.error,
              result.failure.description,
              result.failure.status
            )
          : HttpServerResponse.jsonUnsafe(result.success, {
              headers: { "cache-control": "no-store" },
            });
      })
    );

    yield* router.add("POST", "/oauth/device/approve", (request) =>
      Effect.gen(function* () {
        const token = bearerFromHeaders(request);
        if (token === null) {
          return jsonError(
            "invalid_request",
            "Missing Clerk session token",
            401
          );
        }
        const clerkResult = yield* clerk.verify(token).pipe(Effect.result);
        if (clerkResult._tag === "Failure") {
          return jsonError("access_denied", "Session verification failed", 401);
        }
        const resolved = yield* identity.resolve({
          sub: clerkResult.success.sub,
        });
        const body = yield* readBody(request);
        const result = yield* flow
          .approveDeviceAuthorization({
            userCode: body.user_code ?? "",
            userId: resolved.user.id,
            workspaceId: body.workspace_id ?? "",
            scopes: parseScopes(body.scope),
          })
          .pipe(Effect.result);
        return result._tag === "Failure"
          ? jsonError(
              result.failure.error,
              result.failure.description,
              result.failure.status
            )
          : HttpServerResponse.jsonUnsafe({ approved: true });
      })
    );

    yield* router.add("GET", "/oauth/device/transaction", (request) =>
      Effect.gen(function* () {
        const token = bearerFromHeaders(request);
        if (token === null) {
          return jsonError(
            "invalid_request",
            "Missing Clerk session token",
            401
          );
        }
        const clerkResult = yield* clerk.verify(token).pipe(Effect.result);
        if (clerkResult._tag === "Failure") {
          return jsonError("access_denied", "Session verification failed", 401);
        }
        const code =
          new URL(request.url, config.asIssuer).searchParams.get("user_code") ??
          "";
        const result = yield* flow
          .inspectDeviceAuthorization(code)
          .pipe(Effect.result);
        return result._tag === "Failure"
          ? jsonError(
              result.failure.error,
              result.failure.description,
              result.failure.status
            )
          : HttpServerResponse.jsonUnsafe(result.success, {
              headers: { "cache-control": "no-store" },
            });
      })
    );

    yield* router.add("POST", "/oauth/device/deny", (request) =>
      Effect.gen(function* () {
        const token = bearerFromHeaders(request);
        if (token === null) {
          return jsonError(
            "invalid_request",
            "Missing Clerk session token",
            401
          );
        }
        const clerkResult = yield* clerk.verify(token).pipe(Effect.result);
        if (clerkResult._tag === "Failure") {
          return jsonError("access_denied", "Session verification failed", 401);
        }
        const body = yield* readBody(request);
        const result = yield* flow
          .denyDeviceAuthorization(body.user_code ?? "")
          .pipe(Effect.result);
        return result._tag === "Failure"
          ? jsonError(
              result.failure.error,
              result.failure.description,
              result.failure.status
            )
          : HttpServerResponse.jsonUnsafe({ denied: true });
      })
    );

    // JWKS for our AS signing key.
    yield* router.add(
      "GET",
      "/.well-known/jwks.json",
      tokens
        .jwks()
        .pipe(Effect.map((jwks) => HttpServerResponse.jsonUnsafe(jwks, cache)))
    );

    yield* router.add("POST", "/oauth/introspect", (request) =>
      Effect.gen(function* () {
        const body = yield* readBody(request);
        const token = body.token ?? bearerFromHeaders(request) ?? "";
        const verified = yield* tokens
          .verifyAccessToken(token)
          .pipe(Effect.result);
        return HttpServerResponse.jsonUnsafe(
          verified._tag === "Failure"
            ? { active: false }
            : { active: true, ...verified.success },
          { headers: { "cache-control": "no-store" } }
        );
      })
    );

    // RFC 9728 protected-resource metadata.
    yield* router.add(
      "GET",
      "/.well-known/oauth-protected-resource",
      Effect.succeed(
        HttpServerResponse.jsonUnsafe(
          {
            resource: config.apiResource,
            authorization_servers: [config.asIssuer],
            scopes_supported: [...SCOPES],
            bearer_methods_supported: ["header"],
          },
          cache
        )
      )
    );

    // GET /oauth/authorize → validate + redirect to the app consent page.
    yield* router.add("GET", "/oauth/authorize", (request) =>
      Effect.sync(() => {
        const url = new URL(request.url, config.asIssuer);
        const params = url.searchParams;
        if (params.get("response_type") !== "code") {
          return jsonError(
            "unsupported_response_type",
            "Only code is supported",
            400
          );
        }
        if (
          !(
            params.get("client_id") &&
            params.get("redirect_uri") &&
            params.get("code_challenge")
          )
        ) {
          return jsonError(
            "invalid_request",
            "Missing required parameters",
            400
          );
        }
        if ((params.get("code_challenge_method") ?? "S256") !== "S256") {
          return jsonError(
            "invalid_request",
            "Only PKCE S256 is supported",
            400
          );
        }
        const consent = new URL(`${config.appBaseUrl}/oauth/consent`);
        consent.search = params.toString();
        return HttpServerResponse.redirect(consent.toString());
      })
    );

    // POST /oauth/authorize/finalize → Clerk-authenticated code issuance.
    yield* router.add("POST", "/oauth/authorize/finalize", (request) =>
      Effect.gen(function* () {
        const token = bearerFromHeaders(request);
        if (token === null) {
          return jsonError(
            "invalid_request",
            "Missing Clerk session token",
            401
          );
        }
        const clerkResult = yield* clerk.verify(token).pipe(Effect.result);
        if (clerkResult._tag === "Failure") {
          return jsonError("access_denied", "Session verification failed", 401);
        }
        const resolved = yield* identity.resolve({
          sub: clerkResult.success.sub,
        });
        const body = yield* readBody(request);
        const issue = yield* flow
          .issueCode({
            clientId: body.client_id ?? "",
            userId: resolved.user.id,
            redirectUri: body.redirect_uri ?? "",
            scopes: parseScopes(body.scope),
            codeChallenge: body.code_challenge ?? "",
            codeChallengeMethod: body.code_challenge_method ?? "S256",
            resource: body.resource ?? null,
            workspaceId: body.workspace_id ?? null,
          })
          .pipe(Effect.result);
        if (issue._tag === "Failure") {
          return jsonError(
            issue.failure.error,
            issue.failure.description,
            issue.failure.status
          );
        }
        const redirect = new URL(body.redirect_uri ?? "");
        redirect.searchParams.set("code", issue.success.code);
        if (body.state) {
          redirect.searchParams.set("state", body.state);
        }
        return HttpServerResponse.jsonUnsafe({
          redirect_to: redirect.toString(),
        });
      })
    );

    // POST /oauth/token → authorization_code and refresh_token grants.
    yield* router.add("POST", "/oauth/token", (request) =>
      Effect.gen(function* () {
        const body = yield* readBody(request);
        const grantType = body.grant_type;
        const noStore = {
          headers: { "cache-control": "no-store", pragma: "no-cache" },
        };
        if (grantType === "authorization_code") {
          const result = yield* flow
            .exchangeCode({
              code: body.code ?? "",
              clientId: body.client_id ?? "",
              redirectUri: body.redirect_uri ?? "",
              codeVerifier: body.code_verifier ?? "",
            })
            .pipe(Effect.result);
          return result._tag === "Failure"
            ? jsonError(
                result.failure.error,
                result.failure.description,
                result.failure.status
              )
            : HttpServerResponse.jsonUnsafe(result.success, noStore);
        }
        if (grantType === "refresh_token") {
          const result = yield* flow
            .refresh({
              refreshToken: body.refresh_token ?? "",
              clientId: body.client_id ?? "",
            })
            .pipe(Effect.result);
          return result._tag === "Failure"
            ? jsonError(
                result.failure.error,
                result.failure.description,
                result.failure.status
              )
            : HttpServerResponse.jsonUnsafe(result.success, noStore);
        }
        if (grantType === DEVICE_GRANT_TYPE) {
          const result = yield* flow
            .exchangeDeviceCode({
              deviceCode: body.device_code ?? "",
              clientId: body.client_id ?? "",
            })
            .pipe(Effect.result);
          return result._tag === "Failure"
            ? jsonError(
                result.failure.error,
                result.failure.description,
                result.failure.status
              )
            : HttpServerResponse.jsonUnsafe(result.success, noStore);
        }
        return jsonError(
          "unsupported_grant_type",
          `Unsupported grant_type: ${grantType ?? "(none)"}`,
          400
        );
      })
    );

    // POST /oauth/revoke → RFC 7009 (always 200).
    yield* router.add("POST", "/oauth/revoke", (request) =>
      Effect.gen(function* () {
        const body = yield* readBody(request);
        yield* flow.revoke(body.token ?? "");
        return HttpServerResponse.empty({ status: 200 });
      })
    );
  })
);
