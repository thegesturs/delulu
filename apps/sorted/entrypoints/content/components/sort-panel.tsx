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
    <div className="sorted-panel-container">
      <div className="sorted-panel-controls">
        {/* Sort Metric */}
        <div className="sorted-control-group">
          <label htmlFor="sorted-metric">Sort by:</label>
          <select
            id="sorted-metric"
            value={sortMetric}
            onChange={(e) => setSortMetric(e.target.value as SortMetric)}
            disabled={isSorting}
            className="sorted-select"
          >
            <option value="views">Views</option>
            <option value="likes">Likes</option>
            <option value="comments">Comments</option>
          </select>
        </div>

        {/* Quantity */}
        <div className="sorted-control-group">
          <label htmlFor="sorted-quantity">Number of reels:</label>
          <select
            id="sorted-quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={isSorting}
            className="sorted-select"
          >
            <option value={12}>12 reels</option>
            <option value={25}>25 reels</option>
            <option value={50}>50 reels</option>
            <option value={100}>100 reels</option>
          </select>
        </div>

        {/* Sort Button */}
        <button
          type="button"
          onClick={handleSort}
          disabled={isSorting}
          className="sorted-button-primary"
        >
          {isSorting ? 'Sorting...' : 'Sort Reels'}
        </button>

        {/* Reset Button */}
        {isActive && onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={isSorting}
            className="sorted-button-secondary"
          >
            Show Original
          </button>
        )}
      </div>
    </div>
  );
}
