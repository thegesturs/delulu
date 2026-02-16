/**
 * Individual reel card component
 */

import { useState } from "react";
import type { ReelData } from "../../shared/types";
import { transcribeReel } from "../utils/transcription-api";

interface ReelCardProps {
  reel: ReelData;
  rank: number;
}

function formatMetric(value: number | undefined | null): string {
  if (value === undefined || value === null) {
    return "N/A";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toString();
}

// Top-level regex patterns for video URL extraction (biome perf)
const OG_VIDEO_REGEX = /<meta\s+property="og:video"\s+content="([^"]+)"/;
const OG_VIDEO_URL_REGEX =
  /<meta\s+property="og:video:url"\s+content="([^"]+)"/;
const JSON_VIDEO_URL_REGEX = /"video_url":"(https?:[^"]+)"/;
// Matches "video_versions":[{"url":"https:\/\/..."}] with escaped slashes
const VIDEO_VERSIONS_REGEX =
  /"video_versions"\s*:\s*\[\s*\{[^}]*"url"\s*:\s*"([^"]+)"/;

/**
 * Decode a JSON-escaped URL (handles \/, \u0026, etc.)
 */
function decodeEscapedUrl(url: string): string {
  return url
    .replace(/\\u[\da-fA-F]{4}/g, (m) =>
      String.fromCharCode(Number.parseInt(m.slice(2), 16))
    )
    .replace(/\\\//g, "/");
}

/**
 * Try to resolve a video URL for a reel.
 * Uses cached videoUrl if available, otherwise fetches the reel page
 * and extracts the video URL from Open Graph meta tags.
 */
export async function resolveVideoUrl(reel: ReelData): Promise<string | null> {
  // Use cached URL from GraphQL if available
  if (reel.videoUrl) {
    return reel.videoUrl;
  }

  try {
    // Fetch the reel page (same-origin, no CORS issues)
    const res = await fetch(reel.url, {
      credentials: "include",
      headers: { Accept: "text/html" },
    });
    const html = await res.text();

    // Try og:video meta tag first
    const ogMatch = html.match(OG_VIDEO_REGEX);
    if (ogMatch) {
      return ogMatch[1];
    }

    // Try og:video:url
    const ogUrlMatch = html.match(OG_VIDEO_URL_REGEX);
    if (ogUrlMatch) {
      return ogUrlMatch[1];
    }

    // Try "video_url":"https://..." pattern
    const jsonMatch = html.match(JSON_VIDEO_URL_REGEX);
    if (jsonMatch) {
      return decodeEscapedUrl(jsonMatch[1]);
    }

    // Try "video_versions":[{"url":"..."}] pattern (Instagram's common format)
    const versionsMatch = html.match(VIDEO_VERSIONS_REGEX);
    if (versionsMatch) {
      return decodeEscapedUrl(versionsMatch[1]);
    }
  } catch {
    // Fetch failed — fall through
  }

  return null;
}

async function downloadVideo(reel: ReelData) {
  const videoUrl = await resolveVideoUrl(reel);

  if (!videoUrl) {
    window.open(reel.url, "_blank");
    return;
  }

  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `reel-${reel.id}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // CORS fallback: open video URL in new tab
    window.open(videoUrl, "_blank");
  }
}

export function ReelCard({ reel, rank }: ReelCardProps) {
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null
  );

  const handleClick = (e: React.MouseEvent) => {
    // Ignore clicks on action buttons
    if (
      (e.target as HTMLElement).closest(".sorted-reel-download") ||
      (e.target as HTMLElement).closest(".sorted-reel-transcribe")
    ) {
      return;
    }
    window.open(reel.url, "_blank");
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    downloadVideo(reel);
  };

  const handleTranscribe = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    if (transcribing) {
      return;
    }

    setTranscribing(true);
    setTranscriptionError(null);

    try {
      await transcribeReel(reel, resolveVideoUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Transcription failed";
      if (message === "NOT_SIGNED_IN") {
        setTranscriptionError("Sign in via the Sorted popup to transcribe");
      } else if (message === "QUOTA_EXCEEDED") {
        setTranscriptionError("Free limit reached — upgrade in the popup");
      } else {
        setTranscriptionError(message);
      }
      // Auto-clear error after 4 seconds
      setTimeout(() => setTranscriptionError(null), 4000);
    } finally {
      setTranscribing(false);
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: card component requires click handling
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: card component requires click handling
    // biome-ignore lint/a11y/useKeyWithClickEvents: handled by parent component
    <div className="sorted-reel-card" onClick={handleClick}>
      {/* Rank badge */}
      <div className="sorted-reel-rank">{rank}</div>

      {/* Thumbnail */}
      <div className="sorted-reel-thumbnail">
        {reel.thumbnailUrl ? (
          <img alt={`Reel #${rank}`} loading="lazy" src={reel.thumbnailUrl} />
        ) : (
          <div className="sorted-grid-placeholder">
            <svg
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
            >
              <rect height="20" rx="5" ry="5" width="20" x="2" y="2" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="sorted-reel-metrics">
        {reel.metrics.views !== undefined && (
          <div className="sorted-metric">
            <span className="sorted-metric-icon">
              <svg
                fill="none"
                height="14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                width="14"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <span className="sorted-metric-value">
              {formatMetric(reel.metrics.views)}
            </span>
          </div>
        )}

        {reel.metrics.likes !== undefined && (
          <div className="sorted-metric">
            <span className="sorted-metric-icon">
              <svg
                fill="none"
                height="14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                width="14"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </span>
            <span className="sorted-metric-value">
              {formatMetric(reel.metrics.likes)}
            </span>
          </div>
        )}

        {reel.metrics.comments !== undefined && (
          <div className="sorted-metric">
            <span className="sorted-metric-icon">
              <svg
                fill="none"
                height="14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                width="14"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </span>
            <span className="sorted-metric-value">
              {formatMetric(reel.metrics.comments)}
            </span>
          </div>
        )}
      </div>

      {/* Transcribe button — positioned below download button */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: transcribe action */}
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: transcribe action */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: transcribe action */}
      <div
        className={`sorted-reel-transcribe ${transcribing ? "loading" : ""}`}
        onClick={handleTranscribe}
        title="Transcribe audio"
      >
        {transcribing ? (
          <div className="sorted-loading-spinner-sm" />
        ) : (
          <svg
            fill="none"
            height="14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            width="14"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="9" x2="15" y1="10" y2="10" />
            <line x1="12" x2="12" y1="7" y2="13" />
          </svg>
        )}
      </div>

      {/* Error tooltip */}
      {transcriptionError && (
        <div className="sorted-transcription-error">{transcriptionError}</div>
      )}

      {/* Download button — rendered LAST so it sits above the metrics overlay */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: download action */}
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: download action */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: download action */}
      <div
        className="sorted-reel-download"
        onClick={handleDownload}
        title="Download video"
      >
        <svg
          fill="none"
          height="14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          width="14"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
      </div>
    </div>
  );
}
