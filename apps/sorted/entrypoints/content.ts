/**
 * Content script for Instagram integration
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { OverlayPanel } from './content/components/OverlayPanel';
import { isReelsTab, monitorUrlChanges } from './content/utils/url-detector';
import { UI_CONFIG } from './shared/constants';
import './content/styles/overlay.css';

export default defineContentScript({
  matches: ['*://www.instagram.com/*', '*://instagram.com/*'],

  main() {
    console.log('[Sorted] Content script loaded');

    let shadowRoot: ShadowRoot | null = null;
    let fabButton: HTMLElement | null = null;
    let reactRoot: any = null;
    let cleanupUrlMonitor: (() => void) | null = null;

    /**
     * Create and inject the FAB (Floating Action Button)
     */
    function createFAB() {
      if (fabButton) return;

      fabButton = document.createElement('div');
      fabButton.id = 'sorted-fab';
      fabButton.style.cssText = `
        position: fixed;
        bottom: ${UI_CONFIG.FAB_POSITION.bottom};
        right: ${UI_CONFIG.FAB_POSITION.right};
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: ${UI_CONFIG.Z_INDEX.FAB};
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        font-size: 28px;
      `;

      fabButton.innerHTML = '📊';

      fabButton.addEventListener('mouseenter', () => {
        fabButton!.style.transform = 'scale(1.1)';
        fabButton!.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
      });

      fabButton.addEventListener('mouseleave', () => {
        fabButton!.style.transform = 'scale(1)';
        fabButton!.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      });

      fabButton.addEventListener('click', () => {
        showOverlay();
      });

      document.body.appendChild(fabButton);
      console.log('[Sorted] FAB created');
    }

    /**
     * Remove the FAB
     */
    function removeFAB() {
      if (fabButton) {
        fabButton.remove();
        fabButton = null;
        console.log('[Sorted] FAB removed');
      }
    }

    /**
     * Create shadow DOM container for overlay
     */
    function createShadowContainer() {
      if (shadowRoot) return;

      const container = document.createElement('div');
      container.id = 'sorted-overlay-container';
      shadowRoot = container.attachShadow({ mode: 'open' });

      // Inject styles into shadow DOM
      const style = document.createElement('style');
      style.textContent = getOverlayStyles();
      shadowRoot.appendChild(style);

      // Create root element for React
      const rootElement = document.createElement('div');
      rootElement.id = 'sorted-root';
      shadowRoot.appendChild(rootElement);

      document.body.appendChild(container);
      console.log('[Sorted] Shadow container created');
    }

    /**
     * Show the overlay
     */
    function showOverlay() {
      if (!shadowRoot) {
        createShadowContainer();
      }

      const rootElement = shadowRoot!.querySelector('#sorted-root');
      if (!rootElement) {
        console.error('[Sorted] Root element not found');
        return;
      }

      // Create React root if it doesn't exist
      if (!reactRoot) {
        reactRoot = createRoot(rootElement);
      }

      // Render the overlay
      reactRoot.render(React.createElement(OverlayPanel, { onClose: hideOverlay }));
      console.log('[Sorted] Overlay shown');
    }

    /**
     * Hide the overlay
     */
    function hideOverlay() {
      if (reactRoot) {
        reactRoot.unmount();
        reactRoot = null;
      }
      console.log('[Sorted] Overlay hidden');
    }

    /**
     * Handle URL changes
     */
    function handleUrlChange(newUrl: string) {
      console.log('[Sorted] URL changed:', newUrl);

      if (isReelsTab(newUrl)) {
        // On reels tab - show FAB
        createFAB();
      } else {
        // Not on reels tab - remove FAB and overlay
        removeFAB();
        hideOverlay();
      }
    }

    /**
     * Initialize the extension
     */
    function initialize() {
      console.log('[Sorted] Initializing...');

      // Check if we're on a reels tab
      if (isReelsTab()) {
        createFAB();
      }

      // Monitor URL changes
      cleanupUrlMonitor = monitorUrlChanges(handleUrlChange);

      console.log('[Sorted] Initialized');
    }

    /**
     * Cleanup on script unload
     */
    function cleanup() {
      console.log('[Sorted] Cleaning up...');
      removeFAB();
      hideOverlay();
      if (cleanupUrlMonitor) {
        cleanupUrlMonitor();
      }
      if (shadowRoot) {
        const container = shadowRoot.host;
        container.remove();
        shadowRoot = null;
      }
    }

    // Initialize
    initialize();

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
  },
});

/**
 * Get overlay styles as string
 * This will be replaced by the actual CSS content later
 */
function getOverlayStyles(): string {
  // For now, return basic styles
  // The full styles will be in overlay.css
  return `
    * {
      box-sizing: border-box;
    }

    .sorted-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: ${UI_CONFIG.Z_INDEX.OVERLAY};
      display: flex;
      align-items: center;
      justify-content: center;
      animation: sortedFadeIn ${UI_CONFIG.FADE_DURATION}ms ease;
    }

    @keyframes sortedFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .sorted-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
    }

    .sorted-panel {
      position: relative;
      width: ${UI_CONFIG.OVERLAY_WIDTH};
      max-width: ${UI_CONFIG.OVERLAY_MAX_WIDTH};
      height: ${UI_CONFIG.OVERLAY_HEIGHT};
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      animation: sortedScaleIn ${UI_CONFIG.SCALE_DURATION}ms ease;
      overflow: hidden;
    }

    @keyframes sortedScaleIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `;
}
