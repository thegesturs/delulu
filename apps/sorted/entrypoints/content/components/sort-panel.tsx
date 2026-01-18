/**
 * Sort panel that injects into Instagram page
 */

import { useState } from 'react';
import type { SortMetric } from '../../shared/types';

interface SortPanelProps {
  onSort: (metric: SortMetric, quantity: number) => void;
  isSorting: boolean;
  onReset?: () => void;
  isActive: boolean;
}

export function SortPanel({ onSort, isSorting, onReset, isActive }: SortPanelProps) {
  const [sortMetric, setSortMetric] = useState<SortMetric>('views');
  const [quantity, setQuantity] = useState<number>(25);

  const handleSort = () => {
    onSort(sortMetric, quantity);
  };

  return (
    <div className="sorted-panel-compact">
      <div className="sorted-compact-controls">
        {/* Metric Selector */}
        <div className="sorted-compact-group">
          <label className={`sorted-compact-radio ${sortMetric === 'views' ? 'active' : ''}`}>
            <input
              type="radio"
              name="metric"
              value="views"
              checked={sortMetric === 'views'}
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              disabled={isSorting}
            />
            <span>Views</span>
          </label>
          <label className={`sorted-compact-radio ${sortMetric === 'likes' ? 'active' : ''}`}>
            <input
              type="radio"
              name="metric"
              value="likes"
              checked={sortMetric === 'likes'}
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              disabled={isSorting}
            />
            <span>Likes</span>
          </label>
          <label className={`sorted-compact-radio ${sortMetric === 'comments' ? 'active' : ''}`}>
            <input
              type="radio"
              name="metric"
              value="comments"
              checked={sortMetric === 'comments'}
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              disabled={isSorting}
            />
            <span>Comments</span>
          </label>
          <label className={`sorted-compact-radio ${sortMetric === 'oldest' ? 'active' : ''}`}>
            <input
              type="radio"
              name="metric"
              value="oldest"
              checked={sortMetric === 'oldest'}
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              disabled={isSorting}
            />
            <span>Oldest</span>
          </label>
        </div>

        <div className="sorted-divider" />

        {/* Quantity Selector */}
        <div className="sorted-compact-group">
          <select 
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={isSorting}
            className="sorted-compact-select"
          >
            <option value={12}>12 Reels</option>
            <option value={25}>25 Reels</option>
            <option value={50}>50 Reels</option>
            <option value={100}>100 Reels</option>
          </select>
        </div>

        {/* Info Text - Moved inside panel */}
        {isActive && (
          <div className="sorted-info-text" style={{ 
            marginLeft: 'auto', 
            marginRight: '16px',
            fontSize: '13px', 
            fontWeight: 500,
            color: 'var(--sorted-text-secondary)'
          }}>
            Latest {quantity} Reels Sorted
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={handleSort}
          disabled={isSorting}
          className="sorted-compact-button"
          style={{ marginLeft: isActive ? 0 : 'auto' }}
        >
          {isSorting ? (
            <div className="sorted-loading-spinner-sm" />
          ) : (
            'Sort'
          )}
        </button>

        {isActive && onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={isSorting}
            className="sorted-compact-reset"
            title="Reset to Original"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
