/**
 * Individual reel card component
 */

import type { ReelData } from '../../shared/types';

interface ReelCardProps {
  reel: ReelData;
  rank: number;
}

function formatMetric(value: number | undefined): string {
  if (value === undefined) {
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
    <div className="sorted-reel-card" onClick={handleClick}>
      {/* Rank badge */}
      <div className="sorted-reel-rank">#{rank}</div>

      {/* Thumbnail */}
      <div className="sorted-reel-thumbnail">
        {reel.thumbnailUrl ? (
          <img src={reel.thumbnailUrl} alt={`Reel #${rank}`} loading="lazy" />
        ) : (
          <div className="sorted-reel-placeholder">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="sorted-reel-metrics">
        {reel.metrics.views !== undefined && (
          <div className="sorted-metric">
            <span className="sorted-metric-icon">👁️</span>
            <span className="sorted-metric-value">{formatMetric(reel.metrics.views)}</span>
          </div>
        )}

        {reel.metrics.likes !== undefined && (
          <div className="sorted-metric">
            <span className="sorted-metric-icon">❤️</span>
            <span className="sorted-metric-value">{formatMetric(reel.metrics.likes)}</span>
          </div>
        )}

        {reel.metrics.comments !== undefined && (
          <div className="sorted-metric">
            <span className="sorted-metric-icon">💬</span>
            <span className="sorted-metric-value">{formatMetric(reel.metrics.comments)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
