/**
 * Popup UI — Auth states, usage display, and status
 */

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/chrome-extension";
import { useEffect, useState } from "react";
import { isReelsTab } from "../content/utils/url-detector";
import "./App.css";

interface UsageData {
  used: number;
  limit: number;
}

function App() {
  const [isOnReelsTab, setIsOnReelsTab] = useState(false);
  const { user } = useUser();
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) {
        setIsOnReelsTab(isReelsTab(tab.url));
      }
    });
  }, []);

  // Load usage from chrome.storage (set by content script after transcription)
  useEffect(() => {
    if (!user) {
      return;
    }
    chrome.storage.local.get(["transcriptionUsage"], (result) => {
      if (result.transcriptionUsage) {
        setUsage(result.transcriptionUsage);
      }
    });
  }, [user]);

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

        {/* Instructions */}
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
