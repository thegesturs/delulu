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
                  {/* Rank Badge with Indigo */}
                  <div className="sorted-grid-rank">
                    <span className="sorted-grid-rank-number">#{index + 1}</span>
                  </div>

                  {/* Metrics with clean icons */}
                  <div className="sorted-grid-stats">
                    {/* Views */}
                    <div className="sorted-grid-metric">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      <span>{formatMetric(reel.metrics.views)}</span>
                    </div>

                    {/* Likes */}
                    <div className="sorted-grid-metric">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <span>{formatMetric(reel.metrics.likes)}</span>
                    </div>

                    {/* Comments */}
                    <div className="sorted-grid-metric">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span>{formatMetric(reel.metrics.comments)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
