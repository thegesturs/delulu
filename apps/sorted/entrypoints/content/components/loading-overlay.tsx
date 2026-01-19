/**
 * Loading Overlay - Indigo vignette effect during sorting
 */

import './loading-overlay.css';

interface LoadingOverlayProps {
  message?: string;
  progress?: string;
}

export function LoadingOverlay({ message = 'Analyzing reels...', progress }: LoadingOverlayProps) {
  return (
    <div className="sorted-loading-overlay">
      {/* Vignette effect - indigo at corners, subtle black in center */}
      <div className="sorted-loading-vignette" />

      {/* Loading content */}
      <div className="sorted-loading-content">
        <div className="sorted-loading-spinner">
          <div className="sorted-loading-spinner-ring" />
          <div className="sorted-loading-spinner-ring" />
          <div className="sorted-loading-spinner-ring" />
        </div>

        <div className="sorted-loading-text">
          <p className="sorted-loading-message">{message}</p>
          {progress && <p className="sorted-loading-progress">{progress}</p>}
        </div>
      </div>
    </div>
  );
}
