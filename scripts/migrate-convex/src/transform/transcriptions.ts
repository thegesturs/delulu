import { makeId, TranscriptionId } from "@delulu/core";
import { epochToDateOr } from "../idmap";
import type { LegacyTranscription } from "../legacy";
import type { TransformContext } from "./context";
import { COUNTER } from "./counters";

/**
 * transcriptions → the owner's personal workspace, `media_id` null. Sorted
 * extension fields (reelId/reelUrl/altText) are dropped and counted; text,
 * language, and duration carry over verbatim (§4.5).
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
    ctx.counters.bump(COUNTER.transcriptionsFieldsDropped);
    ctx.load.transcriptions.push({
      id: makeId(TranscriptionId),
      legacyConvexId: transcription._id,
      workspaceId,
      mediaId: null,
      text: transcription.text,
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
