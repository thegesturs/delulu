import { useState } from "react";
import type { Transcription } from "./types";
import { extractReelLabel, formatDuration } from "./utils";

export function HistoryItem({ item }: { item: Transcription }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasAlt = !!item.altText;
  const [showRoman, setShowRoman] = useState(true);

  const displayText = hasAlt && showRoman ? item.altText! : item.text;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: popup history item
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: popup history item
    // biome-ignore lint/a11y/noStaticElementInteractions: popup history item
    <div
      className={`popup-history-item ${expanded ? "expanded" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="popup-history-item-header">
        <div className="popup-history-item-meta">
          <span className="popup-history-duration">
            {formatDuration(item.durationSeconds)}
          </span>
          {hasAlt && (
            <span className="popup-history-script-toggle">
              <button
                className={`popup-history-script-btn ${showRoman ? "" : "active"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRoman(false);
                }}
                title="Devanagari"
                type="button"
              >
                हिंदी
              </button>
              <button
                className={`popup-history-script-btn ${showRoman ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRoman(true);
                }}
                title="Hinglish"
                type="button"
              >
                Aa
              </button>
            </span>
          )}
        </div>
        <div className="popup-history-actions">
          {/* Instagram icon — open reel */}
          <a
            className="popup-history-icon-btn"
            href={item.reelUrl}
            onClick={(e) => e.stopPropagation()}
            rel="noopener noreferrer"
            target="_blank"
            title={extractReelLabel(item.reelUrl)}
          >
            <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
          {/* Copy icon */}
          <button
            className={`popup-history-icon-btn ${copied ? "copied" : ""}`}
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy text"}
            type="button"
          >
            {copied ? (
              <svg
                fill="currentColor"
                height="16"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M9.86 18a1 1 0 0 1-.73-.32l-4.86-5.17a1.001 1.001 0 0 1 1.46-1.37l4.12 4.39 8.41-9.2a1 1 0 1 1 1.48 1.34l-9.14 10a1 1 0 0 1-.73.33h-.01z" />
              </svg>
            ) : (
              <svg
                fill="currentColor"
                height="16"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M7.024 3.75c0-.966.784-1.75 1.75-1.75H20.25c.966 0 1.75.784 1.75 1.75v11.498a1.75 1.75 0 0 1-1.75 1.75H8.774a1.75 1.75 0 0 1-1.75-1.75Zm1.75-.25a.25.25 0 0 0-.25.25v11.498c0 .139.112.25.25.25H20.25a.25.25 0 0 0 .25-.25V3.75a.25.25 0 0 0-.25-.25Z" />
                <path d="M1.995 10.749a1.75 1.75 0 0 1 1.75-1.751H5.25a.75.75 0 1 1 0 1.5H3.745a.25.25 0 0 0-.25.25L3.5 20.25c0 .138.111.25.25.25h9.5a.25.25 0 0 0 .25-.25v-1.51a.75.75 0 1 1 1.5 0v1.51A1.75 1.75 0 0 1 13.25 22h-9.5A1.75 1.75 0 0 1 2 20.25Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <p className={`popup-history-text ${expanded ? "expanded" : ""}`}>
        {displayText}
      </p>
    </div>
  );
}
