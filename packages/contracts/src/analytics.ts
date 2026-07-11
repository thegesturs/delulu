import {
  AnalyticsProviderError,
  LiveInsights,
  WorkspaceOperationalStats,
} from "@delulu/core/domain/analytics";
import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from "effect/unstable/httpapi";
import {
  ForbiddenErrorResponse,
  NotFoundErrorResponse,
  ValidationErrorResponse,
} from "./errors";
import { Authentication } from "./middleware";

const WorkspacePath = { workspaceId: Schema.String };
const analyticsErrors = [
  ForbiddenErrorResponse,
  NotFoundErrorResponse,
  ValidationErrorResponse,
  AnalyticsProviderError.pipe(HttpApiSchema.status(503)),
];

export const OperationalCountsResponse = WorkspaceOperationalStats;
export const LiveInsightsResponse = LiveInsights;

export const AnalyticsGroup = HttpApiGroup.make("analytics")
  .add(
    HttpApiEndpoint.get("operational", "/operational", {
      params: WorkspacePath,
      success: OperationalCountsResponse,
      error: analyticsErrors,
    }).annotate(OpenApi.Summary, "Get exact workspace operational counts"),
    HttpApiEndpoint.get("insights", "/connections/:connectionId/insights", {
      params: { ...WorkspacePath, connectionId: Schema.String },
      query: { windowDays: Schema.optional(Schema.NumberFromString) },
      success: LiveInsightsResponse,
      error: analyticsErrors,
    }).annotate(OpenApi.Summary, "Get live platform insights with comparison")
  )
  .middleware(Authentication)
  .prefix("/v1/workspaces/:workspaceId/analytics")
  .annotate(OpenApi.Title, "Analytics");
