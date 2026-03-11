/**
 * Popup UI — Auth states, usage display, transcription history, and status
 */
/** biome-ignore-all lint/performance/useTopLevelRegex: <explanation> */

import {
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/chrome-extension";
import { api } from "@delulu/database/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { useCallback, useEffect, useState } from "react";
import { isReelsTab } from "../content/utils/url-detector";
import "./App.css";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
const SYNC_HOST = import.meta.env.VITE_CLERK_SYNC_HOST;
const convex = new ConvexHttpClient(CONVEX_URL);

interface ActiveTranscription {
  reelId: string;
  reelUrl: string;
  startedAt: number;
}

interface UsageData {
  used: number;
  limit: number;
  isSubscribed: boolean;
  paidSoftLimit: number;
  paidHardLimit: number;
}

// Infer the transcription type from the Convex query
type Transcription = Awaited<
  ReturnType<
    typeof convex.query<typeof api.transcriptions.getUserTranscriptions>
  >
>[number];

function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${Math.round(seconds)}s`;
}

const REEL_URL_REGEX =
  /instagram\.com\/([^/]+)\/reel\/|instagram\.com\/reel\/([^/?]+)/;

function extractReelLabel(reelUrl: string): string {
  const match = reelUrl.match(REEL_URL_REGEX);
  if (match) {
    const username = match[1];
    if (username && username !== "reel") {
      return `@${username}`;
    }
  }
  // Fallback: show shortened reel ID
  const idMatch = reelUrl.match(/\/reel\/([^/?]+)/);
  return idMatch ? `Reel ${idMatch[1].slice(0, 8)}...` : "Reel";
}

function HistoryItem({ item }: { item: Transcription }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: popup history item
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: popup history item
    // biome-ignore lint/a11y/noStaticElementInteractions: popup history item
    <div
      className={`popup-history-item ${expanded ? "expanded" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="popup-history-item-header">
        <div className="popup-history-item-meta">
          <span className="popup-history-lang">
            {item.language.toUpperCase()}
          </span>
          <span className="popup-history-duration">
            {formatDuration(item.durationSeconds)}
          </span>
          <a
            className="popup-history-reel-link"
            href={item.reelUrl}
            onClick={(e) => e.stopPropagation()}
            rel="noopener noreferrer"
            target="_blank"
          >
            {extractReelLabel(item.reelUrl)}
          </a>
        </div>
        <button
          className={`popup-history-copy ${copied ? "copied" : ""}`}
          onClick={handleCopy}
          type="button"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className={`popup-history-text ${expanded ? "expanded" : ""}`}>
        {item.text}
      </p>
    </div>
  );
}

const PREVIEW_LIMIT = 5;

function App() {
  const [isOnReelsTab, setIsOnReelsTab] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const { user } = useUser();
  const { getToken } = useAuth();
  const [active, setActive] = useState<ActiveTranscription | null>(null);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async () => {
    try {
      setSubscribing(true);
      const token = await getToken({ template: "convex" });
      if (!token) {
        return;
      }
      convex.setAuth(token);
      const { checkout_url } = await convex.action(
        api.subscriptions.createCheckoutSession,
        { productId: "pdt_0NYbkcEzkjqKXheG8mvVT" }
      );
      chrome.tabs.create({ url: checkout_url });
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setSubscribing(false);
    }
  };

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) {
        setIsOnReelsTab(isReelsTab(tab.url));
      }
    });
  }, []);

  // Fetch transcription data from Convex via HTTP (no WebSocket)
  const fetchConvexData = useCallback(async () => {
    if (!user) {
      return;
    }
    try {
      const token = await getToken({ template: "convex" });
      if (!token) {
        return;
      }
      convex.setAuth(token);
      const [txns, usageData] = await Promise.all([
        convex.query(api.transcriptions.getUserTranscriptions, {}),
        convex.query(api.transcriptions.getMyTranscriptionUsage, {}),
      ]);
      setTranscriptions(txns);
      setUsage(usageData);
    } catch {
      // Auth not ready yet or query failed — ignore
    }
  }, [user, getToken]);

  useEffect(() => {
    fetchConvexData();
  }, [fetchConvexData]);

  // Load active transcription from chrome.storage (transient content-script state)
  // and re-fetch Convex data when a transcription completes
  useEffect(() => {
    if (!user) {
      return;
    }
    chrome.storage.local.get(["activeTranscription"], (result) => {
      setActive(result.activeTranscription ?? null);
    });

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area !== "local") {
        return;
      }
      if (changes.activeTranscription) {
        const newVal = changes.activeTranscription.newValue ?? null;
        setActive(newVal);
        // When activeTranscription is cleared, a transcription just completed — refetch
        if (!newVal) {
          fetchConvexData();
        }
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [user, fetchConvexData]);

  const hasHistory = transcriptions.length > 0;
  const previewItems = transcriptions.slice(0, PREVIEW_LIMIT);
  const hasMore = transcriptions.length > PREVIEW_LIMIT;

  // Billing page view
  if (showBilling) {
    return (
      <div className="popup-container">
        <div className="popup-header">
          <div className="popup-header-top">
            <button
              className="popup-back-button"
              onClick={() => setShowBilling(false)}
              type="button"
            >
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
          {/* CTA — top of page */}
          {usage?.isSubscribed ? (
            <div className="popup-billing-subscribed">
              <span className="popup-billing-subscribed-icon">✓</span>
              You're on the Pro plan
            </div>
          ) : (
            <button
              className="popup-billing-cta"
              disabled={subscribing}
              onClick={handleSubscribe}
              type="button"
            >
              {subscribing ? "Loading..." : "Subscribe — $2/mo"}
            </button>
          )}

          {/* Pro tier info */}
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

          {/* How billing works */}
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

          {/* Free tier info */}
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

  // Full-page history view
  if (showAllHistory) {
    return (
      <div className="popup-container">
        <div className="popup-header">
          <div className="popup-header-top">
            <button
              className="popup-back-button"
              onClick={() => setShowAllHistory(false)}
              type="button"
            >
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-header-top">
          <div className="popup-header-left">
            <img alt="Sorted" className="popup-icon-img" src="/icon/48.png" />
            <div>
              <h1 className="popup-title">Sorted</h1>
              <p className="popup-subtitle">Instagram Reel Sorter</p>
            </div>
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>

      {/* Content */}
      <div className="popup-content">
        {/* Auth Section — show sign-in when signed out */}
        <SignedOut>
          <div className="popup-auth-card">
            <div className="popup-auth-icon">🔑</div>
            <h3>Sign in to unlock transcription</h3>
            <p>
              Transcribe reel audio to text with AI. Get 10 free transcriptions
              per month.
            </p>
            <button
              className="popup-signin-button"
              onClick={() =>
                chrome.tabs.create({
                  url: `${SYNC_HOST}/sign-in?redirect_url=/extension-auth-success`,
                })
              }
              type="button"
            >
              Sign in with Delulu
            </button>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Usage Meter */}
          <div className="popup-usage-card">
            <div className="popup-usage-header">
              <span className="popup-usage-label">
                Transcriptions
                {usage?.isSubscribed && (
                  <span className="popup-pro-badge">Pro</span>
                )}
              </span>
              <span className="popup-usage-count">
                {usage
                  ? usage.isSubscribed
                    ? `${usage.used.toLocaleString()}/${usage.paidHardLimit.toLocaleString()}`
                    : `${usage.used}/${usage.limit} free`
                  : "–/10 free"}
              </span>
            </div>
            <div className="popup-usage-bar-bg">
              <div
                className="popup-usage-bar-fill"
                style={{
                  width: `${Math.min(
                    ((usage?.used ?? 0) /
                      (usage?.isSubscribed
                        ? (usage?.paidHardLimit ?? 1000)
                        : (usage?.limit ?? 10))) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
            {usage && !usage.isSubscribed && usage.used >= usage.limit && (
              <p className="popup-usage-limit-msg">
                Free limit reached.{" "}
                {/* biome-ignore lint/a11y/useValidAnchor: acts as navigation link */}
                <a
                  className="popup-usage-limit-link"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowBilling(true);
                  }}
                >
                  Subscribe to continue
                </a>
              </p>
            )}
            {usage?.isSubscribed && usage.used >= 900 && (
              <p className="popup-usage-limit-msg">
                {usage.used >= usage.paidHardLimit
                  ? "Monthly limit reached. Contact support@delulu.social for higher limits."
                  : `Approaching monthly limit — ${(usage.paidHardLimit - usage.used).toLocaleString()} transcriptions remaining`}
              </p>
            )}
          </div>

          {/* Active Transcription */}
          {active && (
            <div className="popup-active-card">
              <div className="popup-active-dot" />
              <div className="popup-active-content">
                <span className="popup-active-label">
                  Transcribing a reel...
                </span>
                <span className="popup-active-sublabel">
                  This may take up to a minute
                </span>
              </div>
            </div>
          )}

          {/* Transcription History */}
          {hasHistory && (
            <div className="popup-history-section">
              <div className="popup-history-section-header">
                <h4 className="popup-history-header">Recent Transcriptions</h4>
                {hasMore && (
                  <button
                    className="popup-history-show-more"
                    onClick={() => setShowAllHistory(true)}
                    type="button"
                  >
                    Show all
                  </button>
                )}
              </div>
              <div className="popup-history-list">
                {previewItems.map((item) => (
                  <HistoryItem
                    item={item}
                    key={`${item.reelId}-${item.createdAt}`}
                  />
                ))}
              </div>
            </div>
          )}
        </SignedIn>

        {/* Status */}
        <div className={`popup-status ${isOnReelsTab ? "active" : ""}`}>
          {isOnReelsTab ? (
            <>
              <div className="popup-status-icon">✅</div>
              <h3>Active on Reels Tab</h3>
              <p>
                The sorting panel should appear above the reels grid on the
                Instagram page.
              </p>
            </>
          ) : (
            <>
              <div className="popup-status-icon">ℹ️</div>
              <h3>Navigate to Reels Tab</h3>
              <p>Visit any Instagram profile's reels tab to use Sorted.</p>
              <p className="popup-example">
                Example: instagram.com/natgeo/reels/
              </p>
            </>
          )}
        </div>

        {/* Instructions — only when no history */}
        {!hasHistory && (
          <div className="popup-instructions">
            <h4>How to Use:</h4>
            <ol>
              <li>Go to any Instagram profile's reels tab</li>
              <li>The sort panel will appear automatically</li>
              <li>Select sort metric and quantity</li>
              <li>Click "Sort Reels"</li>
              <li>Hover a reel to download or transcribe</li>
            </ol>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="popup-footer">
        <p className="popup-version">v1.2.0</p>
        <a
          className="popup-footer-link"
          href="https://delulu.social"
          rel="noopener noreferrer"
          target="_blank"
        >
          delulu.social
        </a>
      </div>
    </div>
  );
}

export default App;
