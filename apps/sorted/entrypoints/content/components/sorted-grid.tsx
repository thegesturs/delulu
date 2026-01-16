/**
 * Sorted reels grid that replaces Instagram's grid
 */

import type { ReelData, SortMetric } from '../../shared/types';

interface SortedGridProps {
  reels: ReelData[];
  sortMetric: SortMetric;
  quantity: number;
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

  return value.toLocaleString();
}

function getMetricLabel(metric: SortMetric): string {
  switch (metric) {
    case 'views':
      return 'Most Viewed';
    case 'likes':
      return 'Most Liked';
    case 'comments':
      return 'Most Commented';
  }
}

export function SortedGrid({ reels, sortMetric, quantity }: SortedGridProps) {
  console.log('[Sorted] Rendering grid with', reels.length, 'reels');
  console.log('[Sorted] Sample reel:', reels[0]);

  return (
    <div className="sorted-grid-container">
      {/* Header */}
      <div className="sorted-grid-header">
        <h2>
          <span className="sorted-icon">📊</span>
          Latest {quantity} Reels
        </h2>
        <h3>{getMetricLabel(sortMetric)} Reels</h3>
      </div>

      {/* Grid */}
      <div className="sorted-grid">
        {reels.map((reel, index) => (
          <a
            key={reel.id}
            href={reel.url}
            className="sorted-grid-item"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* Thumbnail */}
            <div className="sorted-grid-thumbnail">
              {reel.thumbnailUrl ? (
                <img src={reel.thumbnailUrl} alt={`Reel ${index + 1}`} />
              ) : (
                <div className="sorted-grid-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                    <line x1="7" y1="2" x2="7" y2="22" />
                    <line x1="17" y1="2" x2="17" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                </div>
              )}

              {/* Metrics Overlay on Hover */}
              <div className="sorted-grid-overlay">
                <div className="sorted-grid-metrics">
                  {reel.metrics.views !== undefined && (
                    <div className="sorted-grid-metric">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                      <span>{formatMetric(reel.metrics.views)}</span>
                    </div>
                  )}

                  {reel.metrics.likes !== undefined && (
                    <div className="sorted-grid-metric">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span>{formatMetric(reel.metrics.likes)}</span>
                    </div>
                  )}

                  {reel.metrics.comments !== undefined && (
                    <div className="sorted-grid-metric">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                      <span>{formatMetric(reel.metrics.comments)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
