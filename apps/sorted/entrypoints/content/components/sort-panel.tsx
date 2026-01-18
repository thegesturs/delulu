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
        {/* Delulu Logo */}
        <div className="sorted-logo">
          <svg
            className="sorted-icon"
            width="24"
            height="24"
            viewBox="0 0 227 261"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M73.9491 2.85403C70.6351 0.310031 102.319 -0.717962 118 1.42404C148.932 5.65011 176.901 10.4076 202.811 28.369C221.302 41.1822 226.366 66.7097 226.444 87.5C226.527 109.533 222.484 132.314 214.949 153C200.84 191.731 178.883 227.431 143.23 249.288C138.837 251.982 124.035 258.344 118.931 259.732C117.304 260.174 116.418 260.415 116.148 260.11C115.826 259.746 116.382 258.605 117.6 256.101C123.785 243.386 125.708 237.738 128.53 224C133.907 197.822 121.728 186.374 105.064 201.941C94.5848 211.722 84.8848 219.589 72.8521 226.814C51.0383 239.912 29.6319 237.212 7.25009 229.931C-0.835913 227.301 -1.37691 226.676 3.08609 225.12C20.1071 219.186 46.1771 186.441 44.6081 172.965C43.7091 165.248 38.5301 163.983 26.2051 168.47C3.81309 176.622 -3.89391 158.87 13.0001 138.054C32.7562 113.716 62.7723 98.2116 80.1471 71.947C95.2917 49.0446 97.594 20.9976 73.9491 2.85403ZM120.474 50.052C108.916 72.86 132.246 102.518 152.095 90.25C156.776 87.357 163.609 79.703 161.991 79.164C151.685 75.7187 140.135 62.1023 132.801 54.687C123.098 44.874 123.098 44.874 120.474 50.052ZM203 63.664C198.969 70.077 193.721 74.716 186.257 78.465C180.187 81.513 180.535 85.231 187.499 91.75C193.488 97.357 207.5 89.5 210 81C211 76.5 211.747 57.5983 207.007 58.048C206.728 58.074 204.925 60.602 203 63.664ZM127.954 116.75C125.914 129.28 140.379 140.485 151 143.626C167.773 148.585 184.832 141.643 196.159 125.25C199.637 120.217 199.304 119.917 194.812 124.037C178.831 138.694 164 136 155 134C146 132 128.093 115.896 127.954 116.75Z"
            />
          </svg>
        </div>

        <div className="sorted-divider" />

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
