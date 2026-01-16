/**
 * Sort controls component for selecting metric and quantity
 */

import { useState } from 'react';
import type { SortMetric, Quantity } from '../../shared/types';

interface SortControlsProps {
  onSort: (metric: SortMetric, quantity: Quantity) => void;
  onCancel?: () => void;
  disabled?: boolean;
  isScaping?: boolean;
}

export function SortControls({ onSort, onCancel, disabled, isScaping }: SortControlsProps) {
  const [sortMetric, setSortMetric] = useState<SortMetric>('views');
  const [quantity, setQuantity] = useState<Quantity>(25);

  const handleSort = () => {
    onSort(sortMetric, quantity);
  };

  return (
    <div className="sorted-controls">
      <div className="sorted-control-section">
        <label className="sorted-label">Sort by:</label>
        <div className="sorted-radio-group">
          <label className="sorted-radio">
            <input
              type="radio"
              name="metric"
              value="views"
              checked={sortMetric === 'views'}
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              disabled={disabled}
            />
            <span>Views</span>
          </label>

          <label className="sorted-radio">
            <input
              type="radio"
              name="metric"
              value="likes"
              checked={sortMetric === 'likes'}
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              disabled={disabled}
            />
            <span>Likes</span>
          </label>

          <label className="sorted-radio">
            <input
              type="radio"
              name="metric"
              value="comments"
              checked={sortMetric === 'comments'}
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              disabled={disabled}
            />
            <span>Comments</span>
          </label>
        </div>
      </div>

      <div className="sorted-control-section">
        <label className="sorted-label">Quantity:</label>
        <div className="sorted-radio-group">
          <label className="sorted-radio">
            <input
              type="radio"
              name="quantity"
              value="25"
              checked={quantity === 25}
              onChange={() => setQuantity(25)}
              disabled={disabled}
            />
            <span>25 reels</span>
          </label>

          <label className="sorted-radio">
            <input
              type="radio"
              name="quantity"
              value="50"
              checked={quantity === 50}
              onChange={() => setQuantity(50)}
              disabled={disabled}
            />
            <span>50 reels</span>
          </label>

          <label className="sorted-radio">
            <input
              type="radio"
              name="quantity"
              value="all"
              checked={quantity === 'all'}
              onChange={() => setQuantity('all')}
              disabled={disabled}
            />
            <span>All reels</span>
          </label>
        </div>
      </div>

      <div className="sorted-control-actions">
        {isScaping && onCancel ? (
          <button
            type="button"
            className="sorted-button sorted-button-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            className="sorted-button sorted-button-primary"
            onClick={handleSort}
            disabled={disabled}
          >
            Sort Reels
          </button>
        )}
      </div>
    </div>
  );
}
