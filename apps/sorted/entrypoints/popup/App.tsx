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

// Infer the transcription type from the paginated Convex query
type TranscriptionPage = Awaited<
  ReturnType<
    typeof convex.query<typeof api.transcriptions.getUserTranscriptions>
  >
>;
type Transcription = TranscriptionPage["page"][number];

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
  const hasAlt = !!item.altText;
  const [showRoman, setShowRoman] = useState(true);

  const displayText = hasAlt && showRoman ? item.altText! : item.text;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(displayText);
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
          <span className="popup-history-duration">
            {formatDuration(item.durationSeconds)}
          </span>
          {hasAlt && (
            <span className="popup-history-script-toggle">
              <button
                className={`popup-history-script-btn ${showRoman ? "" : "active"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRoman(false);
                }}
                title="Devanagari"
                type="button"
              >
                हिंदी
              </button>
              <button
                className={`popup-history-script-btn ${showRoman ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRoman(true);
                }}
                title="Hinglish"
                type="button"
              >
                Aa
              </button>
            </span>
          )}
        </div>
        <div className="popup-history-actions">
          {/* Instagram icon — open reel */}
          <a
            className="popup-history-icon-btn"
            href={item.reelUrl}
            onClick={(e) => e.stopPropagation()}
            rel="noopener noreferrer"
            target="_blank"
            title={extractReelLabel(item.reelUrl)}
          >
            <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
          {/* Copy icon */}
          <button
            className={`popup-history-icon-btn ${copied ? "copied" : ""}`}
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy text"}
            type="button"
          >
            {copied ? (
              <svg
                fill="currentColor"
                height="16"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M9.86 18a1 1 0 0 1-.73-.32l-4.86-5.17a1.001 1.001 0 0 1 1.46-1.37l4.12 4.39 8.41-9.2a1 1 0 1 1 1.48 1.34l-9.14 10a1 1 0 0 1-.73.33h-.01z" />
              </svg>
            ) : (
              <svg
                fill="currentColor"
                height="16"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M7.024 3.75c0-.966.784-1.75 1.75-1.75H20.25c.966 0 1.75.784 1.75 1.75v11.498a1.75 1.75 0 0 1-1.75 1.75H8.774a1.75 1.75 0 0 1-1.75-1.75Zm1.75-.25a.25.25 0 0 0-.25.25v11.498c0 .139.112.25.25.25H20.25a.25.25 0 0 0 .25-.25V3.75a.25.25 0 0 0-.25-.25Z" />
                <path d="M1.995 10.749a1.75 1.75 0 0 1 1.75-1.751H5.25a.75.75 0 1 1 0 1.5H3.745a.25.25 0 0 0-.25.25L3.5 20.25c0 .138.111.25.25.25h9.5a.25.25 0 0 0 .25-.25v-1.51a.75.75 0 1 1 1.5 0v1.51A1.75 1.75 0 0 1 13.25 22h-9.5A1.75 1.75 0 0 1 2 20.25Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <p className={`popup-history-text ${expanded ? "expanded" : ""}`}>
        {displayText}
      </p>
    </div>
  );
}

const PAGE_SIZE = 10;

function App() {
  const [isOnReelsTab, setIsOnReelsTab] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const { user } = useUser();
  const { getToken } = useAuth();
  const [active, setActive] = useState<ActiveTranscription | null>(null);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
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

  // Fetch first page of transcriptions + usage from Convex via HTTP
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
      const [result, usageData] = await Promise.all([
        convex.query(api.transcriptions.getUserTranscriptions, {
          paginationOpts: { numItems: PAGE_SIZE, cursor: null },
        }),
        convex.query(api.transcriptions.getMyTranscriptionUsage, {}),
      ]);
      setTranscriptions(result.page);
      setCursor(result.continueCursor);
      setIsDone(result.isDone);
      setUsage(usageData);
    } catch {
      // Auth not ready yet or query failed — ignore
    }
  }, [user, getToken]);

  // Load next page of transcriptions
  const loadMore = useCallback(async () => {
    if (isDone || loadingMore || !cursor) {
      return;
    }
    setLoadingMore(true);
    try {
      const token = await getToken({ template: "convex" });
      if (!token) {
        return;
      }
      convex.setAuth(token);
      const result = await convex.query(
        api.transcriptions.getUserTranscriptions,
        { paginationOpts: { numItems: PAGE_SIZE, cursor } }
      );
      setTranscriptions((prev) => [...prev, ...result.page]);
      setCursor(result.continueCursor);
      setIsDone(result.isDone);
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [isDone, loadingMore, cursor, getToken]);

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
            {!isDone && (
              <button
                className="popup-history-load-more"
                disabled={loadingMore}
                onClick={loadMore}
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
                    ? usage.used > usage.paidSoftLimit
                      ? `${usage.used.toLocaleString()} / ${usage.paidHardLimit.toLocaleString()}`
                      : `${usage.used.toLocaleString()} / ${usage.paidSoftLimit.toLocaleString()}`
                    : `${usage.used}/${usage.limit} free`
                  : "–/10 free"}
              </span>
            </div>
            {usage?.isSubscribed ? (
              (() => {
                const used = usage.used;
                const soft = usage.paidSoftLimit;
                const hard = usage.paidHardLimit;
                const isOverage = used > soft;

                if (!isOverage) {
                  // Under soft limit — bar max = soft limit, simple blue fill
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

                // Over soft limit — bar max = hard limit, blue + red with marker
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
                        Monthly limit reached. Contact support@delulu.social for
                        higher limits.
                      </p>
                    )}
                  </>
                );
              })()
            ) : (
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
                        setShowBilling(true);
                      }}
                    >
                      Subscribe to continue
                    </a>
                  </p>
                )}
              </>
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
                {!isDone && (
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
                {transcriptions.slice(0, PAGE_SIZE).map((item) => (
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
