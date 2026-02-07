/**
 * Sorted reels grid that replaces Instagram's grid
 */

import type { ReelData, SortMetric } from "../../shared/types";
import { ReelCard } from "./reel-card";

interface SortedGridProps {
  reels: ReelData[];
  sortMetric: SortMetric;
  quantity: number;
}

export function SortedGrid({ reels, sortMetric, quantity }: SortedGridProps) {
  return (
    <div className="sorted-grid-container">
      {/* Header removed as it's now in the panel */}

      {/* Grid */}
      <div className="sorted-results-grid">
        {reels.map((reel, index) => (
          <ReelCard key={reel.id} rank={index + 1} reel={reel} />
        ))}
      </div>
    </div>
  );
}
