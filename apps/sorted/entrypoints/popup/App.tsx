/**
 * Popup UI - Status and Info
 */

import { useState, useEffect } from 'react';
import { isReelsTab } from '../content/utils/url-detector';
import './App.css';

function App() {
  const [isOnReelsTab, setIsOnReelsTab] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Check current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) {
        setCurrentUrl(tab.url);
        setIsOnReelsTab(isReelsTab(tab.url));
      }
    });
  }, []);

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-icon">📊</div>
        <h1 className="popup-title">Sorted</h1>
        <p className="popup-subtitle">Instagram Reel Sorter</p>
        <div className="popup-branding">
          <span>by</span>
          <a href="https://delulu.social" target="_blank" rel="noopener noreferrer">
            delulu.social
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="popup-content">
        <div className={`popup-status ${isOnReelsTab ? 'active' : ''}`}>
          {isOnReelsTab ? (
            <>
              <div className="popup-status-icon">✅</div>
              <h3>Active on Reels Tab</h3>
              <p>The sorting panel should appear above the reels grid on the Instagram page.</p>
            </>
          ) : (
            <>
              <div className="popup-status-icon">ℹ️</div>
              <h3>Navigate to Reels Tab</h3>
              <p>Visit any Instagram profile's reels tab to use Sorted.</p>
              <p className="popup-example">Example: instagram.com/natgeo/reels/</p>
            </>
          )}
        </div>

        <div className="popup-instructions">
          <h4>How to Use:</h4>
          <ol>
            <li>Go to any Instagram profile's reels tab</li>
            <li>The sort panel will appear automatically</li>
            <li>Select sort metric and quantity</li>
            <li>Click "Sort Reels"</li>
            <li>Reels will be sorted and displayed!</li>
          </ol>
        </div>

        {/* Debug Info */}
        {currentUrl && (
          <details className="popup-debug">
            <summary>Debug Info</summary>
            <p className="popup-url">{currentUrl}</p>
            <p>Is Reels Tab: {isOnReelsTab ? 'Yes' : 'No'}</p>
          </details>
        )}
      </div>

      {/* Footer */}
      <div className="popup-footer">
        <p className="popup-version">Version 1.0.0</p>
      </div>
    </div>
  );
}

export default App;
