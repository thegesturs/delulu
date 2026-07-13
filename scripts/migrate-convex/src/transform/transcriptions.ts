import { makeId, TranscriptionId } from "@delulu/core";
import { epochToDateOr } from "../idmap";
import type { LegacyTranscription } from "../legacy";
import type { TransformContext } from "./context";

/**
 * transcriptions → the owner's personal workspace, `media_id` null. Extension
 * reel identity and alternate text are retained for history and cache cutover.
 */
export const transformTranscriptions = (
  ctx: TransformContext,
  transcriptions: readonly LegacyTranscription[]
): void => {
  for (const transcription of transcriptions) {
    const workspaceId = ctx.personalWorkspaceByUser.get(transcription.userId);
    if (workspaceId === undefined) {
      ctx.warnings.push(
        `transcriptions/${transcription._id}: user ${transcription.userId} not migrated — dropped`
      );
      continue;
    }
    ctx.load.transcriptions.push({
      id: makeId(TranscriptionId),
      legacyConvexId: transcription._id,
      workspaceId,
      mediaId: null,
      reelId: transcription.reelId,
      reelUrl: transcription.reelUrl,
      text: transcription.text,
      altText: transcription.altText ?? null,
      language: transcription.language ?? null,
      durationSeconds: transcription.durationSeconds ?? null,
      createdAt: epochToDateOr(
        transcription.createdAt ?? transcription._creationTime,
        transcription._creationTime
      ),
      updatedAt: epochToDateOr(
        transcription.createdAt,
        transcription._creationTime
      ),
    });
  }
};
