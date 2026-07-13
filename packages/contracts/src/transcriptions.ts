import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/unstable/httpapi";
import { NotFoundErrorResponse, ValidationErrorResponse } from "./errors";
import { Authentication } from "./middleware";

export const TranscriptionResponse = Schema.Struct({
  id: Schema.String,
  reelId: Schema.String,
  reelUrl: Schema.String,
  text: Schema.String,
  altText: Schema.optional(Schema.String),
  language: Schema.String,
  durationSeconds: Schema.Number,
  createdAt: Schema.Number,
});

export const TranscriptionUsageResponse = Schema.Struct({
  used: Schema.Number,
  limit: Schema.Number,
  periodEnd: Schema.Number,
  isSortedActive: Schema.Boolean,
  isSubscribed: Schema.Boolean,
  paidSoftLimit: Schema.Number,
  paidHardLimit: Schema.Number,
  dodoCustomerId: Schema.NullOr(Schema.String),
});

export const TranscriptionsGroup = HttpApiGroup.make("transcriptions")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: {
        limit: Schema.optional(Schema.NumberFromString),
        cursor: Schema.optional(Schema.String),
      },
      success: Schema.Struct({
        page: Schema.Array(TranscriptionResponse),
        continueCursor: Schema.String,
        isDone: Schema.Boolean,
      }),
      error: [NotFoundErrorResponse, ValidationErrorResponse],
    }),
    HttpApiEndpoint.get("usage", "/usage", {
      success: TranscriptionUsageResponse,
      error: NotFoundErrorResponse,
    }),
    HttpApiEndpoint.post("checkout", "/checkout", {
      payload: Schema.Struct({ productId: Schema.String }),
      success: Schema.Struct({ checkoutUrl: Schema.String }),
      error: ValidationErrorResponse,
    })
  )
  .middleware(Authentication)
  .prefix("/v1/transcriptions")
  .annotate(OpenApi.Title, "Transcriptions");
