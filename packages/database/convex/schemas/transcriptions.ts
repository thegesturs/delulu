import { v } from "convex/values";

// ============================================================================
// TRANSCRIPTION SCHEMAS
// ============================================================================

// Base transcription schema for storing reel transcriptions
export const baseTranscriptionSchema = v.object({
  userId: v.id("users"),
  reelId: v.string(),
  reelUrl: v.string(),
  text: v.string(),
  altText: v.optional(v.string()),
  language: v.string(),
  durationSeconds: v.number(),
  createdAt: v.number(),
});

// Transcription schema with system fields (for returns)
export const transcriptionSchema = v.object({
  _id: v.id("transcriptions"),
  _creationTime: v.number(),
  ...baseTranscriptionSchema.fields,
});
