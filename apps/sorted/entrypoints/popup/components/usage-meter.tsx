import type { UsageData } from "./types";

interface UsageMeterProps {
  usage: UsageData | null;
  onShowBilling: () => void;
}

export function UsageMeter({ usage, onShowBilling }: UsageMeterProps) {
  return (
    <div className="popup-usage-card">
      <div className="popup-usage-header">
        <span className="popup-usage-label">
          Transcriptions
          {usage?.isSubscribed && <span className="popup-pro-badge">Pro</span>}
        </span>
        <span className="popup-usage-count">
          {usage
            ? usage.isSubscribed
              ? usage.used > usage.paidSoftLimit
                ? `${usage.used.toLocaleString()} / ${usage.paidHardLimit.toLocaleString()}`
                : `${usage.used.toLocaleString()} / ${usage.paidSoftLimit.toLocaleString()}`
              : `${usage.used}/${usage.limit} free`
            : "–/10 free"}
        </span>
      </div>
      {usage?.isSubscribed ? (
        <PaidUsageBar usage={usage} />
      ) : (
        <FreeUsageBar onShowBilling={onShowBilling} usage={usage} />
      )}
    </div>
  );
}

function PaidUsageBar({ usage }: { usage: UsageData }) {
  const used = usage.used;
  const soft = usage.paidSoftLimit;
  const hard = usage.paidHardLimit;
  const isOverage = used > soft;

  if (!isOverage) {
    const fillWidth = Math.min((used / soft) * 100, 100);
    return (
      <div className="popup-usage-bar-bg">
        <div
          className="popup-usage-bar-fill"
          style={{ width: `${fillWidth}%` }}
        />
      </div>
    );
  }

  const includedWidth = (soft / hard) * 100;
  const overageWidth = Math.min(
    ((used - soft) / hard) * 100,
    100 - includedWidth
  );

  return (
    <>
      <div className="popup-usage-bar-bg popup-usage-bar-paid">
        <div
          className="popup-usage-bar-fill"
          style={{ width: `${includedWidth}%` }}
        />
        <div
          className="popup-usage-bar-overage"
          style={{
            width: `${overageWidth}%`,
            left: `${includedWidth}%`,
          }}
        />
        <div
          className="popup-usage-bar-soft-marker"
          style={{ left: `${includedWidth}%` }}
        />
      </div>
      <div className="popup-usage-legend">
        <span className="popup-usage-legend-item">
          <span className="popup-usage-legend-dot included" />
          Included ({soft})
        </span>
        <span className="popup-usage-legend-item overage">
          <span className="popup-usage-legend-dot overage" />
          Overage (+{used - soft})
        </span>
        <span
          className="popup-usage-legend-item"
          style={{ marginLeft: "auto" }}
        >
          Max {hard.toLocaleString()}
        </span>
      </div>
      {used >= hard && (
        <p className="popup-usage-limit-msg">
          Monthly limit reached. Contact support@delulu.social for higher
          limits.
        </p>
      )}
    </>
  );
}

function FreeUsageBar({
  usage,
  onShowBilling,
}: {
  usage: UsageData | null;
  onShowBilling: () => void;
}) {
  return (
    <>
      <div className="popup-usage-bar-bg">
        <div
          className="popup-usage-bar-fill"
          style={{
            width: `${Math.min(((usage?.used ?? 0) / (usage?.limit ?? 10)) * 100, 100)}%`,
          }}
        />
      </div>
      {usage && usage.used >= usage.limit && (
        <p className="popup-usage-limit-msg">
          Free limit reached.{" "}
          {/* biome-ignore lint/a11y/useValidAnchor: acts as navigation link */}
          <a
            className="popup-usage-limit-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onShowBilling();
            }}
          >
            Subscribe to continue
          </a>
        </p>
      )}
    </>
  );
}
