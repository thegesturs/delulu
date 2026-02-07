/**
 * Loading state component
 */

import type { ScrapingProgress } from "../../shared/types";

interface LoadingStateProps {
  progress: ScrapingProgress;
}

export function LoadingState({ progress }: LoadingStateProps) {
  const percentage =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className="sorted-loading-state">
      <div className="sorted-loading-spinner">
        <svg className="sorted-spinner" viewBox="0 0 50 50">
          <circle
            className="sorted-spinner-path"
            cx="25"
            cy="25"
            fill="none"
            r="20"
            strokeWidth="4"
          />
        </svg>
      </div>

      <div className="sorted-loading-text">
        <h3>
          {progress.status === "scraping" ? "Scraping Reels..." : "Sorting..."}
        </h3>
        {progress.message && (
          <p className="sorted-loading-message">{progress.message}</p>
        )}
      </div>

      {progress.total > 0 && (
        <div className="sorted-progress-bar">
          <div
            className="sorted-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {progress.total > 0 && (
        <p className="sorted-progress-text">
          {progress.current} / {progress.total} reels
        </p>
      )}
    </div>
  );
}
