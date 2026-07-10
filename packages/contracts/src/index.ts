import { Timestamp } from "@delulu/core";
import { Schema } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from "effect/unstable/httpapi";

export const HealthResponse = Schema.Struct({
  status: Schema.Literal("ok"),
  checkedAt: Timestamp,
}).annotate({
  identifier: "HealthResponse",
  description: "Service health and the time at which it was checked",
});

export class HealthUnavailable extends Schema.TaggedErrorClass<HealthUnavailable>()(
  "HealthUnavailable",
  { message: Schema.String, retryable: Schema.Boolean }
) {}

export const HealthUnavailableResponse = HealthUnavailable.pipe(
  HttpApiSchema.status(503)
);

export const HealthGroup = HttpApiGroup.make("health").add(
  HttpApiEndpoint.get("check", "/health", {
    success: HealthResponse,
    error: HealthUnavailableResponse,
  })
    .annotate(OpenApi.Summary, "Check service health")
    .annotate(
      OpenApi.Description,
      "Reports whether the API process is ready to receive requests."
    )
);

export const Api = HttpApi.make("deluluApi")
  .add(HealthGroup)
  .annotate(OpenApi.Title, "Delulu API")
  .annotate(OpenApi.Version, "1.0.0")
  .annotate(
    OpenApi.Description,
    "Typed API contract shared by every backend consumer."
  );
