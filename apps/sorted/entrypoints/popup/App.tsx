/**
 * Popup UI for extension settings
 */

import { useState, useEffect } from 'react';
import type { UserPreferences, SortMetric, Quantity } from '../shared/types';
import { getPreferences, setPreferences } from '../content/utils/storage-manager';
import { DEFAULT_PREFERENCES, SUCCESS_MESSAGES } from '../shared/constants';
import './App.css';

function App() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    getPreferences()
      .then((prefs) => {
        setPreferencesState(prefs);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load preferences:', error);
        setLoading(false);
      });
  }, []);

  // Save preferences
  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await setPreferences(preferences);
      setMessage(SUCCESS_MESSAGES.PREFERENCES_SAVED);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // Open current tab with overlay (if on Instagram reels tab)
  const handleOpenOverlay = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        // Check if tab is on Instagram reels
        const isInstagram = tab.url?.includes('instagram.com');
        if (isInstagram) {
          chrome.tabs.sendMessage(tab.id, { type: 'OPEN_OVERLAY' });
          window.close();
        } else {
          setMessage('Please navigate to an Instagram profile\'s reels tab first');
          setTimeout(() => setMessage(null), 3000);
        }
      }
    } catch (error) {
      console.error('Failed to open overlay:', error);
      setMessage('Failed to open overlay');
    }
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="popup-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-icon">📊</div>
        <h1 className="popup-title">Sorted</h1>
        <p className="popup-subtitle">Instagram Reel Sorter</p>
      </div>

      {/* Settings Form */}
      <div className="popup-content">
        <div className="popup-section">
          <label className="popup-label">Default Sort Metric</label>
          <div className="popup-radio-group">
            <label className="popup-radio">
              <input
                type="radio"
                name="sortMetric"
                value="views"
                checked={preferences.sortMetric === 'views'}
                onChange={(e) =>
                  setPreferencesState({
                    ...preferences,
                    sortMetric: e.target.value as SortMetric,
                  })
                }
              />
              <span>Views</span>
            </label>

            <label className="popup-radio">
              <input
                type="radio"
                name="sortMetric"
                value="likes"
                checked={preferences.sortMetric === 'likes'}
                onChange={(e) =>
                  setPreferencesState({
                    ...preferences,
                    sortMetric: e.target.value as SortMetric,
                  })
                }
              />
              <span>Likes</span>
            </label>

            <label className="popup-radio">
              <input
                type="radio"
                name="sortMetric"
                value="comments"
                checked={preferences.sortMetric === 'comments'}
                onChange={(e) =>
                  setPreferencesState({
                    ...preferences,
                    sortMetric: e.target.value as SortMetric,
                  })
                }
              />
              <span>Comments</span>
            </label>
          </div>
        </div>

        <div className="popup-section">
          <label className="popup-label">Default Quantity</label>
          <div className="popup-radio-group">
            <label className="popup-radio">
              <input
                type="radio"
                name="quantity"
                value="25"
                checked={preferences.quantity === 25}
                onChange={() =>
                  setPreferencesState({
                    ...preferences,
                    quantity: 25,
                  })
                }
              />
              <span>25 reels</span>
            </label>

            <label className="popup-radio">
              <input
                type="radio"
                name="quantity"
                value="50"
                checked={preferences.quantity === 50}
                onChange={() =>
                  setPreferencesState({
                    ...preferences,
                    quantity: 50,
                  })
                }
              />
              <span>50 reels</span>
            </label>

            <label className="popup-radio">
              <input
                type="radio"
                name="quantity"
                value="all"
                checked={preferences.quantity === 'all'}
                onChange={() =>
                  setPreferencesState({
                    ...preferences,
                    quantity: 'all' as Quantity,
                  })
                }
              />
              <span>All reels</span>
            </label>
          </div>
        </div>

        <div className="popup-section">
          <label className="popup-checkbox">
            <input
              type="checkbox"
              checked={preferences.autoSort}
              onChange={(e) =>
                setPreferencesState({
                  ...preferences,
                  autoSort: e.target.checked,
                })
              }
            />
            <span>Auto-sort on page load</span>
          </label>
          <p className="popup-hint">
            Automatically sort reels when you visit a profile's reels tab
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="popup-actions">
        <button
          type="button"
          className="popup-button popup-button-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        <button
          type="button"
          className="popup-button popup-button-secondary"
          onClick={handleOpenOverlay}
        >
          Open Sorter
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`popup-message ${message.includes('Failed') ? 'popup-message-error' : 'popup-message-success'}`}>
          {message}
        </div>
      )}

      {/* Footer */}
      <div className="popup-footer">
        <p className="popup-version">Version 1.0.0</p>
      </div>
    </div>
  );
}

export default App;
