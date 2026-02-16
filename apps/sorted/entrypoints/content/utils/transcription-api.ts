/**
 * Transcription API client.
 * Calls the Lambda endpoint to transcribe reel audio via OpenAI Whisper.
 */

import type { ReelData, TranscriptionResult } from "../../shared/types";
import { getAuthToken } from "./auth";

const TRANSCRIPTION_API_URL = import.meta.env.VITE_TRANSCRIPTION_API_URL;

export async function transcribeReel(
  reel: ReelData,
  resolveVideoUrl: (reel: ReelData) => Promise<string | null>
): Promise<TranscriptionResult> {
  // Get auth token
  const token = await getAuthToken();
  if (!token) {
    throw new Error("NOT_SIGNED_IN");
  }

  // Resolve video URL
  const videoUrl = await resolveVideoUrl(reel);
  if (!videoUrl) {
    throw new Error("Could not resolve video URL for this reel");
  }

  // Call Lambda
  const response = await fetch(TRANSCRIPTION_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      videoUrl,
      reelId: reel.id,
      reelUrl: reel.url,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 402) {
      throw new Error("QUOTA_EXCEEDED");
    }
    if (response.status === 401) {
      throw new Error("NOT_SIGNED_IN");
    }
    throw new Error(data.message || data.error || "Transcription failed");
  }

  return {
    text: data.text,
    language: data.language,
    durationSeconds: data.durationSeconds,
  };
}
