/**
 * Floating transcribe button for individual reel pages (/reel/CODE/)
 */

import { useState } from "react";
import type { ReelData } from "../../shared/types";
import { transcribeReel } from "../utils/transcription-api";
import { resolveVideoUrl } from "./reel-card";

// Extract reel/post ID from URL like /reel/CODE/ or /p/CODE/
const REEL_ID_REGEX = /\/(?:reel|p)\/([^/?]+)/;

function getReelDataFromUrl(): ReelData | null {
  const match = window.location.href.match(REEL_ID_REGEX);
  if (!match) {
    return null;
  }
  return {
    id: match[1],
    url: window.location.href,
    thumbnailUrl: "",
    metrics: {},
    scrapedAt: Date.now(),
  };
}

export function ReelPageFab() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const handleTranscribe = async () => {
    if (state === "loading") {
      return;
    }

    const reel = getReelDataFromUrl();
    if (!reel) {
      return;
    }

    setState("loading");
    setErrorMsg("");

    try {
      await transcribeReel(reel, resolveVideoUrl);
      setState("done");
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Transcription failed";
      setState("error");
      if (message === "NOT_SIGNED_IN") {
        setErrorMsg("Sign in via the Sorted popup");
      } else if (message === "QUOTA_EXCEEDED") {
        setErrorMsg("Free limit reached");
      } else {
        setErrorMsg("Failed");
      }
      setTimeout(() => {
        setState("idle");
        setErrorMsg("");
      }, 3000);
    }
  };

  const label =
    state === "loading"
      ? "Transcribing..."
      : state === "done"
        ? "Done — check popup"
        : state === "error"
          ? errorMsg
          : "Transcribe";

  return (
    <button
      className={`sorted-reel-fab ${state}`}
      onClick={handleTranscribe}
      type="button"
    >
      {state === "loading" ? (
        <div className="sorted-loading-spinner-sm" />
      ) : (
        <svg
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="16"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" x2="15" y1="10" y2="10" />
          <line x1="12" x2="12" y1="7" y2="13" />
        </svg>
      )}
      {label}
    </button>
  );
}
