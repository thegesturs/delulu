/**
 * React hook for accessing Chrome storage with reactive state
 */

import { useState, useEffect, useCallback } from 'react';
import type { UserPreferences } from '../../shared/types';
import { getPreferences, setPreferences } from '../utils/storage-manager';

/**
 * Hook for accessing and updating user preferences
 */
export function usePreferences() {
  const [preferences, setPreferencesState] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    let mounted = true;

    getPreferences()
      .then((prefs) => {
        if (mounted) {
          setPreferencesState(prefs);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: UserPreferences) => {
    try {
      setError(null);
      await setPreferences(newPreferences);
      setPreferencesState(newPreferences);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save preferences';
      setError(message);
      throw err;
    }
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.sorted_preferences) {
        const newValue = changes.sorted_preferences.newValue;
        if (newValue) {
          setPreferencesState(newValue);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
  };
}
