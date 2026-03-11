import { HistoryItem } from "./history-item";
import type { Transcription } from "./types";

interface HistoryPageProps {
  transcriptions: Transcription[];
  isDone: boolean;
  loadingMore: boolean;
  onBack: () => void;
  onLoadMore: () => void;
}

export function HistoryPage({
  transcriptions,
  isDone,
  loadingMore,
  onBack,
  onLoadMore,
}: HistoryPageProps) {
  return (
    <div className="popup-container">
      <div className="popup-header">
        <div className="popup-header-top">
          <button className="popup-back-button" onClick={onBack} type="button">
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <span className="popup-header-title">All Transcriptions</span>
          <div style={{ width: 52 }} />
        </div>
      </div>
      <div className="popup-content">
        <div className="popup-history-section">
          <div className="popup-history-list">
            {transcriptions.map((item) => (
              <HistoryItem
                item={item}
                key={`${item.reelId}-${item.createdAt}`}
              />
            ))}
          </div>
          {!isDone && (
            <button
              className="popup-history-load-more"
              disabled={loadingMore}
              onClick={onLoadMore}
              type="button"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
