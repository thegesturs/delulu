import type { UsageData } from "./types";

interface BillingPageProps {
  usage: UsageData | null;
  subscribing: boolean;
  onBack: () => void;
  onSubscribe: () => void;
}

export function BillingPage({
  usage,
  subscribing,
  onBack,
  onSubscribe,
}: BillingPageProps) {
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
          <span className="popup-header-title">Sorted Pro</span>
          <div style={{ width: 52 }} />
        </div>
      </div>
      <div className="popup-content">
        {usage?.isSubscribed ? (
          <div className="popup-billing-subscribed">
            <span className="popup-billing-subscribed-icon">✓</span>
            You're on the Pro plan
          </div>
        ) : (
          <button
            className="popup-billing-cta"
            disabled={subscribing}
            onClick={onSubscribe}
            type="button"
          >
            {subscribing ? "Loading..." : "Subscribe — $2/mo"}
          </button>
        )}

        <div className="popup-billing-card popup-billing-card-pro">
          <div className="popup-billing-tier">
            <span className="popup-billing-tier-name">
              Pro <span className="popup-pro-badge">Recommended</span>
            </span>
            <span className="popup-billing-tier-price">$2/mo</span>
          </div>
          <p className="popup-billing-detail popup-billing-detail-highlight">
            $0.02 per transcription
          </p>
          <p className="popup-billing-detail">
            Overage is charged based on usage — you only pay for what you use
          </p>
          <p className="popup-billing-detail">
            Up to 1,000 transcriptions/month
          </p>
          <p className="popup-billing-detail">
            Need more? Contact us at support@delulu.social
          </p>
        </div>

        <div className="popup-billing-card">
          <h4 className="popup-billing-section-title">How it works</h4>
          <div className="popup-billing-steps">
            <div className="popup-billing-step">
              <span className="popup-billing-step-num">1</span>
              <span>Subscribe for $2/mo base fee</span>
            </div>
            <div className="popup-billing-step">
              <span className="popup-billing-step-num">2</span>
              <span>Each transcription beyond the base costs $0.02</span>
            </div>
            <div className="popup-billing-step">
              <span className="popup-billing-step-num">3</span>
              <span>Usage is metered and billed at end of cycle</span>
            </div>
          </div>
        </div>

        <div className="popup-billing-card">
          <div className="popup-billing-tier">
            <span className="popup-billing-tier-name">Free</span>
            <span className="popup-billing-tier-price">$0/mo</span>
          </div>
          <p className="popup-billing-detail">10 transcriptions per month</p>
          <p className="popup-billing-detail">Sort reels by any metric</p>
          <p className="popup-billing-detail">Download reel videos</p>
        </div>
      </div>
    </div>
  );
}
