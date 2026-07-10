import { ConnectionsService } from "@delulu/services";
import { Effect, Schema } from "effect";
import { HttpRouter, HttpServerResponse } from "effect/unstable/http";

export const ConnectionRoutes = HttpRouter.use((router) =>
  Effect.gen(function* () {
    const connections = yield* ConnectionsService;
    yield* router.add(
      "GET",
      "/v1/connections/callback/:platform",
      (request) => {
        const url = new URL(request.url, "http://localhost");
        const platform = url.pathname.split("/").at(-1) ?? "";
        const state = url.searchParams.get("state") ?? "";
        return connections
          .handleCallback({
            platform,
            state,
            code: url.searchParams.get("code"),
            error: url.searchParams.get("error"),
            errorReason: url.searchParams.get("error_reason"),
          })
          .pipe(
            Effect.map(HttpServerResponse.fromWeb),
            Effect.catch((error) =>
              Effect.succeed(
                HttpServerResponse.jsonUnsafe(
                  { error: { code: error._tag, message: error.message } },
                  { status: error._tag === "NotFoundError" ? 404 : 400 }
                )
              )
            )
          );
      }
    );
    yield* router.add("POST", "/v1/connections/facebook/complete", (request) =>
      request.text.pipe(
        Effect.flatMap((raw) =>
          connections.completeFacebook(
            Schema.decodeUnknownSync(
              Schema.fromJsonString(
                Schema.Struct({
                  state: Schema.String,
                  code: Schema.String,
                  pageId: Schema.String,
                  pageName: Schema.String,
                })
              )
            )(raw)
          )
        ),
        Effect.map((result) => HttpServerResponse.jsonUnsafe(result)),
        Effect.catch(() =>
          Effect.succeed(
            HttpServerResponse.jsonUnsafe(
              {
                error: {
                  code: "ConflictError",
                  message: "Invalid Facebook completion",
                },
              },
              { status: 400 }
            )
          )
        )
      )
    );
  })
);
