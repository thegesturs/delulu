/**
 * Background service worker
 */

export default defineBackground(() => {
  console.log("[Sorted Background] Service worker initialized", {
    id: browser.runtime.id,
  });

  // Handle extension installation
  browser.runtime.onInstalled.addListener((details) => {
    console.log("[Sorted Background] Extension installed/updated", details);

    if (details.reason === "install") {
      // Show onboarding/welcome page
      console.log("[Sorted Background] First install - showing welcome");
      // Could open a welcome page or show notification
    } else if (details.reason === "update") {
      console.log("[Sorted Background] Extension updated");
      // Could show update notes
    }
  });

  // Handle messages from content scripts or popup
  browser.runtime.onMessage.addListener((message, sender, _sendResponse) => {
    console.log(
      "[Sorted Background] Received message:",
      message,
      "from:",
      sender
    );

    // Handle different message types
    if (message.type === "OPEN_OVERLAY") {
      // Forward to content script
      if (sender.tab?.id) {
        browser.tabs.sendMessage(sender.tab.id, message);
      }
    }

    // Return true to indicate we'll send a response asynchronously
    return true;
  });

  // Monitor tab updates to detect Instagram navigation
  browser.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      const isInstagram = tab.url.includes("instagram.com");
      if (isInstagram) {
        console.log("[Sorted Background] Instagram tab updated:", tab.url);
      }
    }
  });

  // Handle browser action clicks (if needed in the future)
  browser.action?.onClicked.addListener((tab) => {
    console.log("[Sorted Background] Browser action clicked for tab:", tab.id);
    if (tab.id) {
      browser.tabs.sendMessage(tab.id, { type: "OPEN_OVERLAY" });
    }
  });
});
