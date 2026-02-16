/**
 * Transcription API client.
 * Calls the Lambda endpoint to transcribe reel audio via OpenAI Whisper.
 * History is stored in Convex by the Lambda; only activeTranscription
 * is tracked in chrome.storage for the popup's in-progress indicator.
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

  // Mark active transcription in storage
  await chrome.storage.local.set({
    activeTranscription: {
      reelId: reel.id,
      reelUrl: reel.url,
      startedAt: Date.now(),
    },
  });

  let response: Response;
  try {
    // Call Lambda
    response = await fetch(TRANSCRIPTION_API_URL, {
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
  } catch (err) {
    await chrome.storage.local.remove("activeTranscription");
    throw err;
  }

  const data = await response.json();

  if (!response.ok) {
    await chrome.storage.local.remove("activeTranscription");
    if (response.status === 402) {
      throw new Error("QUOTA_EXCEEDED");
    }
    if (response.status === 401) {
      throw new Error("NOT_SIGNED_IN");
    }
    throw new Error(data.message || data.error || "Transcription failed");
  }

  // Clear active state — Convex handles history persistence
  await chrome.storage.local.remove("activeTranscription");

  return {
    text: data.text,
    language: data.language,
    durationSeconds: data.durationSeconds,
  };
}
