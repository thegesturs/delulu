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
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3 className="sorted-error-title">Oops! Something went wrong</h3>
      <p className="sorted-error-message">{error}</p>

      <div className="sorted-error-actions">
        {onRetry && (
          <button
            type="button"
            className="sorted-button sorted-button-primary"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
        {onClose && (
          <button
            type="button"
            className="sorted-button sorted-button-secondary"
            onClick={onClose}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
