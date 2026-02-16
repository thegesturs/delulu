/**
 * Popup UI — Auth states, usage display, transcription history, and status
 */

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/chrome-extension";
import { useCallback, useEffect, useState } from "react";
import { isReelsTab } from "../content/utils/url-detector";
import type { StoredTranscription } from "../shared/types";
import "./App.css";

interface UsageData {
  used: number;
  limit: number;
}

interface ActiveTranscription {
  reelId: string;
  reelUrl: string;
  startedAt: number;
}

function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${Math.round(seconds)}s`;
}

function HistoryItem({ item }: { item: StoredTranscription }) {
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
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: <explanation>
    // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
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
        </div>
        <button
          className="popup-history-copy"
          onClick={handleCopy}
          title="Copy transcription"
          type="button"
        >
          {copied ? (
            <svg
              fill="none"
              height="14"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              fill="none"
              height="14"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
      <p className={`popup-history-text ${expanded ? "expanded" : ""}`}>
        {item.text}
      </p>
    </div>
  );
}

function App() {
  const [isOnReelsTab, setIsOnReelsTab] = useState(false);
  const { user } = useUser();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [history, setHistory] = useState<StoredTranscription[]>([]);
  const [active, setActive] = useState<ActiveTranscription | null>(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) {
        setIsOnReelsTab(isReelsTab(tab.url));
      }
    });
  }, []);

  // Load usage, history, and active transcription from chrome.storage
  const loadStorageData = useCallback(() => {
    if (!user) {
      return;
    }
    chrome.storage.local.get(
      ["transcriptionUsage", "transcriptionHistory", "activeTranscription"],
      (result) => {
        if (result.transcriptionUsage) {
          setUsage(result.transcriptionUsage);
        }
        if (result.transcriptionHistory) {
          setHistory(result.transcriptionHistory);
        }
        setActive(result.activeTranscription ?? null);
      }
    );
  }, [user]);

  useEffect(() => {
    loadStorageData();
  }, [loadStorageData]);

  // Live-update when content script writes to storage
  useEffect(() => {
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area !== "local") {
        return;
      }
      if (changes.transcriptionHistory) {
        setHistory(changes.transcriptionHistory.newValue ?? []);
      }
      if (changes.activeTranscription) {
        setActive(changes.activeTranscription.newValue ?? null);
      }
      if (changes.transcriptionUsage) {
        setUsage(changes.transcriptionUsage.newValue ?? null);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const hasHistory = history.length > 0;

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-header-top">
          <div className="popup-header-left">
            <div className="popup-icon">📊</div>
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
        {/* Auth Section */}
        <SignedOut>
          <div className="popup-auth-card">
            <div className="popup-auth-icon">🔑</div>
            <h3>Sign in to unlock transcription</h3>
            <p>
              Transcribe reel audio to text with AI. Get 10 free transcriptions
              per month.
            </p>
            <SignInButton mode="redirect">
              <button className="popup-signin-button" type="button">
                Sign in with Delulu
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Usage Meter */}
          <div className="popup-usage-card">
            <div className="popup-usage-header">
              <span className="popup-usage-label">Transcriptions</span>
              <span className="popup-usage-count">
                {usage ? `${usage.used}/${usage.limit}` : "0/10"} free
              </span>
            </div>
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
                <a
                  href="https://delulu.social/pricing"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Upgrade to continue
                </a>
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
              <h4 className="popup-history-header">Recent Transcriptions</h4>
              <div className="popup-history-list">
                {history.map((item) => (
                  <HistoryItem
                    item={item}
                    key={`${item.reelId}-${item.timestamp}`}
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
