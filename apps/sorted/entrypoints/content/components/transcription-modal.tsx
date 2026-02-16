/**
 * Transcription modal overlay — shows transcribed text for a reel.
 */

import { useState } from "react";
import type { TranscriptionResult } from "../../shared/types";

interface TranscriptionModalProps {
  result: TranscriptionResult;
  onClose: () => void;
}

export function TranscriptionModal({
  result,
  onClose,
}: TranscriptionModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = result.text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: modal backdrop
    // biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: <explanation>
    <div className="sorted-transcription-backdrop" onClick={onClose}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: modal content */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: modal content */}
      {/** biome-ignore lint/a11y/noNoninteractiveElementInteractions: <explanation> */}
      <div
        className="sorted-transcription-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sorted-transcription-header">
          <div className="sorted-transcription-title-row">
            <span className="sorted-transcription-title">Transcription</span>
            <div className="sorted-transcription-meta">
              <span className="sorted-transcription-badge">
                {result.language.toUpperCase()}
              </span>
              <span className="sorted-transcription-badge">
                {formatDuration(result.durationSeconds)}
              </span>
            </div>
          </div>
          {/* biome-ignore lint/a11y/useButtonType: close button */}
          <button className="sorted-transcription-close" onClick={onClose}>
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
              width="16"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>

        {/* Text */}
        <div className="sorted-transcription-text">{result.text}</div>

        {/* Actions */}
        <div className="sorted-transcription-actions">
          {/* biome-ignore lint/a11y/useButtonType: copy button */}
          <button className="sorted-transcription-copy" onClick={handleCopy}>
            {copied ? (
              <>
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
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </>
            ) : (
              <>
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
                  <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy text
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
