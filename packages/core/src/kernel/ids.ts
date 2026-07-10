import { Schema } from "effect";

const uuid = <Brand extends string>(brand: Brand) =>
  Schema.String.check(Schema.isUUID(7)).pipe(Schema.brand(brand));

export const UserId = uuid("UserId");
export type UserId = typeof UserId.Type;
export const WorkspaceId = uuid("WorkspaceId");
export type WorkspaceId = typeof WorkspaceId.Type;
export const OrgId = WorkspaceId;
export type OrgId = WorkspaceId;
export const MemberId = uuid("MemberId");
export type MemberId = typeof MemberId.Type;
export const ConnectionId = uuid("ConnectionId");
export type ConnectionId = typeof ConnectionId.Type;
export const MediaId = uuid("MediaId");
export type MediaId = typeof MediaId.Type;
export const PostId = uuid("PostId");
export type PostId = typeof PostId.Type;
export const PostGroupId = uuid("PostGroupId");
export type PostGroupId = typeof PostGroupId.Type;
export const PostTargetId = uuid("PostTargetId");
export type PostTargetId = typeof PostTargetId.Type;
export const ApiKeyId = uuid("ApiKeyId");
export type ApiKeyId = typeof ApiKeyId.Type;
export const SubscriptionId = uuid("SubscriptionId");
export type SubscriptionId = typeof SubscriptionId.Type;
export const TransactionId = uuid("TransactionId");
export type TransactionId = typeof TransactionId.Type;
export const PostReviewId = uuid("PostReviewId");
export type PostReviewId = typeof PostReviewId.Type;
export const ReviewActivityId = uuid("ReviewActivityId");
export type ReviewActivityId = typeof ReviewActivityId.Type;
export const AutomationId = uuid("AutomationId");
export type AutomationId = typeof AutomationId.Type;
export const AutomationRunId = uuid("AutomationRunId");
export type AutomationRunId = typeof AutomationRunId.Type;
export const AutomationContactId = uuid("AutomationContactId");
export type AutomationContactId = typeof AutomationContactId.Type;
export const TranscriptionId = uuid("TranscriptionId");
export type TranscriptionId = typeof TranscriptionId.Type;

export const makeUuidV7 = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const timestamp = BigInt(Date.now());
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number((timestamp / 256n ** BigInt(5 - index)) % 256n);
  }
  bytes[6] = (bytes[6] % 16) + 112;
  bytes[8] = (bytes[8] % 64) + 128;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const makeId = <A>(schema: Schema.Decoder<A>): A =>
  Schema.decodeUnknownSync(schema)(makeUuidV7());
