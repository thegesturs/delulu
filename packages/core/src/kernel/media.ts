import { Schema } from "effect";

export const MediaFile = Schema.Struct({
  mediaType: Schema.Literals(["image", "video"]),
  mimeType: Schema.String,
  sizeBytes: Schema.Number.check(Schema.isGreaterThanOrEqualTo(0)),
  width: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))),
  height: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))),
  durationSeconds: Schema.optional(
    Schema.Number.check(Schema.isGreaterThanOrEqualTo(0))
  ),
});
export type MediaFile = typeof MediaFile.Type;

export const MediaConstraints = Schema.Struct({
  allowedTypes: Schema.optional(
    Schema.Array(Schema.Literals(["image", "video"]))
  ),
  allowedMimeTypes: Schema.optional(Schema.Array(Schema.String)),
  maxSizeBytes: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))),
  minWidth: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))),
  maxWidth: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))),
  minHeight: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))),
  maxHeight: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))),
  maxDurationSeconds: Schema.optional(
    Schema.Number.check(Schema.isGreaterThan(0))
  ),
});
export type MediaConstraints = typeof MediaConstraints.Type;

export const MediaValidationResult = Schema.Struct({
  valid: Schema.Boolean,
  errors: Schema.Array(Schema.String),
});
export type MediaValidationResult = typeof MediaValidationResult.Type;

export const validateMediaFile = (
  file: MediaFile,
  constraints: MediaConstraints
): MediaValidationResult => {
  const errors: string[] = [];
  if (
    constraints.allowedTypes &&
    !constraints.allowedTypes.includes(file.mediaType)
  ) {
    errors.push(`Media type ${file.mediaType} is not allowed`);
  }
  if (
    constraints.allowedMimeTypes &&
    !constraints.allowedMimeTypes.includes(file.mimeType)
  ) {
    errors.push(`MIME type ${file.mimeType} is not allowed`);
  }
  if (
    constraints.maxSizeBytes !== undefined &&
    file.sizeBytes > constraints.maxSizeBytes
  ) {
    errors.push(`File exceeds the ${constraints.maxSizeBytes} byte limit`);
  }
  const dimensions: [number | undefined, number | undefined, string][] = [
    [file.width, constraints.minWidth, "minimum width"],
    [file.height, constraints.minHeight, "minimum height"],
  ];
  for (const [actual, minimum, label] of dimensions) {
    if (minimum !== undefined && (actual === undefined || actual < minimum)) {
      errors.push(`File does not meet the ${label} of ${minimum}`);
    }
  }
  if (
    constraints.maxWidth !== undefined &&
    file.width !== undefined &&
    file.width > constraints.maxWidth
  ) {
    errors.push(`File exceeds the maximum width of ${constraints.maxWidth}`);
  }
  if (
    constraints.maxHeight !== undefined &&
    file.height !== undefined &&
    file.height > constraints.maxHeight
  ) {
    errors.push(`File exceeds the maximum height of ${constraints.maxHeight}`);
  }
  if (
    constraints.maxDurationSeconds !== undefined &&
    file.durationSeconds !== undefined &&
    file.durationSeconds > constraints.maxDurationSeconds
  ) {
    errors.push(
      `File exceeds the ${constraints.maxDurationSeconds} second duration limit`
    );
  }
  return { valid: errors.length === 0, errors };
};
