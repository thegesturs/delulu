import { apiReference } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { openApiSpec } from "./openapi";
import v1 from "./routes/v1";
import type { ApiKeyData, Env } from "./types";

interface AppEnv {
  Bindings: Env;
  Variables: { apiKey: ApiKeyData };
}

export function createApp() {
  const app = new Hono<AppEnv>();

  // CORS
  app.use("*", cors());

  // Health check (no auth needed)
  app.get("/health", (c) => c.json({ status: "ok" }));

  // OpenAPI spec + docs (no auth needed)
  app.get("/openapi.json", (c) => c.json(openApiSpec));
  app.get(
    "/docs",
    apiReference({
      url: "/openapi.json",
      theme: "kepler",
    })
  );

  // Auth + rate limiting for all /v1 routes
  app.use("/v1/*", authMiddleware);
  app.use("/v1/*", rateLimitMiddleware);

  // Mount v1 routes
  app.route("/v1", v1);

  // Error handler
  app.onError(errorHandler);

  // 404 handler
  app.notFound((c) =>
    c.json({ error: { code: "NOT_FOUND", message: "Endpoint not found" } }, 404)
  );

  return app;
}
