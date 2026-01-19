/**
 * Individual reel card component
 */

import type { ReelData } from '../../shared/types';

interface ReelCardProps {
  reel: ReelData;
  rank: number;
}

function formatMetric(value: number | undefined | null): string {
  if (value === undefined || value === null) {
    return 'N/A';
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toString();
}

export function ReelCard({ reel, rank }: ReelCardProps) {
  const handleClick = () => {
    window.open(reel.url, '_blank');
  };

  return (
    // biome-ignore lint/nursery/noStaticElementInteractions: <explanation>
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div className="sorted-reel-card" onClick={handleClick}>
      {/* Rank badge */}
      <div className="sorted-reel-rank">{rank}</div>

      {/* Thumbnail */}
      <div className="sorted-reel-thumbnail">
        {reel.thumbnailUrl ? (
          <img src={reel.thumbnailUrl} alt={`Reel #${rank}`} loading="lazy" />
        ) : (
          <div className="sorted-grid-placeholder">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
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
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
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
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
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
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
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
    </div>
  );
}
