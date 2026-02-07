/**
 * Error state component
 */

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export function ErrorState({ error, onRetry, onClose }: ErrorStateProps) {
  return (
    <div className="sorted-error-state">
      <div className="sorted-error-icon">
        <svg
          fill="none"
          height="64"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="64"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      </div>

      <h3 className="sorted-error-title">Oops! Something went wrong</h3>
      <p className="sorted-error-message">{error}</p>

      <div className="sorted-error-actions">
        {onRetry && (
          <button
            className="sorted-button sorted-button-primary"
            onClick={onRetry}
            type="button"
          >
            Try Again
          </button>
        )}
        {onClose && (
          <button
            className="sorted-button sorted-button-secondary"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
