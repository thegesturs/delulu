/**
 * Main overlay panel component
 */

import { useReelScraper } from '../hooks/useReelScraper';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { SortControls } from './SortControls';
import { ReelCard } from './ReelCard';

interface OverlayPanelProps {
  onClose: () => void;
}

export function OverlayPanel({ onClose }: OverlayPanelProps) {
  const {
    sortedReels,
    progress,
    error,
    startScraping,
    cancelScraping,
    reset,
    isScaping,
    isComplete,
    isError,
  } = useReelScraper();

  const handleSort = (metric: 'views' | 'likes' | 'comments', quantity: 25 | 50 | 'all') => {
    startScraping(metric, quantity);
  };

  const handleRetry = () => {
    reset();
  };

  const handleClose = () => {
    if (isScaping) {
      cancelScraping();
    }
    onClose();
  };

  return (
    <div className="sorted-overlay">
      {/* Backdrop */}
      <div className="sorted-backdrop" onClick={handleClose} />

      {/* Panel */}
      <div className="sorted-panel">
        {/* Header */}
        <div className="sorted-header">
          <div className="sorted-header-content">
            <h2 className="sorted-title">Sorted - Instagram Reel Sorter</h2>
            <p className="sorted-subtitle">
              Sort reels by engagement metrics
            </p>
          </div>
          <button
            type="button"
            className="sorted-close-button"
            onClick={handleClose}
            aria-label="Close"
          >
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="sorted-content">
          {/* Controls */}
          {!isComplete && !isScaping && !isError && (
            <SortControls
              onSort={handleSort}
              onCancel={cancelScraping}
              disabled={isScaping}
              isScaping={isScaping}
            />
          )}

          {/* Loading State */}
          {isScaping && (
            <div className="sorted-state-container">
              <LoadingState progress={progress} />
              <button
                type="button"
                className="sorted-button sorted-button-secondary"
                onClick={cancelScraping}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Error State */}
          {isError && error && (
            <div className="sorted-state-container">
              <ErrorState error={error} onRetry={handleRetry} onClose={handleClose} />
            </div>
          )}

          {/* Results */}
          {isComplete && sortedReels.length > 0 && (
            <div className="sorted-results">
              <div className="sorted-results-header">
                <h3 className="sorted-results-title">
                  {sortedReels.length} Reels Sorted
                </h3>
                <button
                  type="button"
                  className="sorted-button sorted-button-secondary sorted-button-small"
                  onClick={handleRetry}
                >
                  Sort Again
                </button>
              </div>

              <div className="sorted-results-grid">
                {sortedReels.map((reel, index) => (
                  <ReelCard key={reel.id} reel={reel} rank={index + 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
