/**
 * Popup UI — Auth states, usage display, transcription history, and status
 */

import {
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
  useUser,
} from "@clerk/chrome-extension";
import { api } from "@delulu/database/convex/_generated/api";
import { useCallback, useEffect, useState } from "react";
import { isReelsTab } from "../content/utils/url-detector";
import "./App.css";
import { BillingPage } from "./components/billing-page";
import { HistoryItem } from "./components/history-item";
import { HistoryPage } from "./components/history-page";
import type {
  ActiveTranscription,
  Transcription,
  UsageData,
} from "./components/types";
import { convex, PAGE_SIZE, SYNC_HOST } from "./components/types";
import { UsageMeter } from "./components/usage-meter";

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
        { productId: import.meta.env.VITE_SORTED_PRODUCT_ID }
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
      <BillingPage
        onBack={() => setShowBilling(false)}
        onSubscribe={handleSubscribe}
        subscribing={subscribing}
        usage={usage}
      />
    );
  }

  // Full-page history view
  if (showAllHistory) {
    return (
      <HistoryPage
        isDone={isDone}
        loadingMore={loadingMore}
        onBack={() => setShowAllHistory(false)}
        onLoadMore={loadMore}
        transcriptions={transcriptions}
      />
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
          <UsageMeter
            onShowBilling={() => setShowBilling(true)}
            usage={usage}
          />

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
