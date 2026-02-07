/**
 * Sort controls component for selecting metric and quantity
 */

import { useState } from "react";
import type { Quantity, SortMetric } from "../../shared/types";

interface SortControlsProps {
  onSort: (metric: SortMetric, quantity: Quantity) => void;
  onCancel?: () => void;
  disabled?: boolean;
  isScaping?: boolean;
}

export function SortControls({
  onSort,
  onCancel,
  disabled,
  isScaping,
}: SortControlsProps) {
  const [sortMetric, setSortMetric] = useState<SortMetric>("views");
  const [quantity, setQuantity] = useState<Quantity>(25);

  const handleSort = () => {
    onSort(sortMetric, quantity);
  };

  return (
    <div className="sorted-controls">
      <div className="sorted-control-section">
        <span className="sorted-label">Sort by:</span>
        <div className="sorted-radio-group">
          <label className="sorted-radio">
            <input
              checked={sortMetric === "views"}
              disabled={disabled}
              name="metric"
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              type="radio"
              value="views"
            />
            <span>Views</span>
          </label>

          <label className="sorted-radio">
            <input
              checked={sortMetric === "likes"}
              disabled={disabled}
              name="metric"
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              type="radio"
              value="likes"
            />
            <span>Likes</span>
          </label>

          <label className="sorted-radio">
            <input
              checked={sortMetric === "comments"}
              disabled={disabled}
              name="metric"
              onChange={(e) => setSortMetric(e.target.value as SortMetric)}
              type="radio"
              value="comments"
            />
            <span>Comments</span>
          </label>
        </div>
      </div>

      <div className="sorted-control-section">
        <span className="sorted-label">Quantity:</span>
        <div className="sorted-radio-group">
          <label className="sorted-radio">
            <input
              checked={quantity === 25}
              disabled={disabled}
              name="quantity"
              onChange={() => setQuantity(25)}
              type="radio"
              value="25"
            />
            <span>25 reels</span>
          </label>

          <label className="sorted-radio">
            <input
              checked={quantity === 50}
              disabled={disabled}
              name="quantity"
              onChange={() => setQuantity(50)}
              type="radio"
              value="50"
            />
            <span>50 reels</span>
          </label>

          <label className="sorted-radio">
            <input
              checked={quantity === "all"}
              disabled={disabled}
              name="quantity"
              onChange={() => setQuantity("all")}
              type="radio"
              value="all"
            />
            <span>All reels</span>
          </label>
        </div>
      </div>

      <div className="sorted-control-actions">
        {isScaping && onCancel ? (
          <button
            className="sorted-button sorted-button-secondary"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        ) : (
          <button
            className="sorted-button sorted-button-primary"
            disabled={disabled}
            onClick={handleSort}
            type="button"
          >
            Sort Reels
          </button>
        )}
      </div>
    </div>
  );
}
