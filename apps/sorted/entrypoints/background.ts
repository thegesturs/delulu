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
      console.log("[Sorted Background] First install - showing welcome");
    } else if (details.reason === "update") {
      console.log("[Sorted Background] Extension updated");
    }
  });

  // Handle messages from content scripts or popup
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(
      "[Sorted Background] Received message:",
      message,
      "from:",
      sender
    );

    // Handle auth token request from content script
    if (message.type === "GET_AUTH_TOKEN") {
      // Retrieve Clerk session token from chrome.storage.local
      // Clerk Chrome Extension stores the session in storage
      chrome.storage.local.get(null, (items) => {
        // Find the Clerk session key
        const clerkKey = Object.keys(items).find(
          (k) => k.startsWith("__clerk") && k.includes("client")
        );
        if (clerkKey && items[clerkKey]) {
          try {
            const data =
              typeof items[clerkKey] === "string"
                ? JSON.parse(items[clerkKey])
                : items[clerkKey];
            // Extract the JWT from Clerk's session data
            const session = data?.sessions?.[0];
            const token = session?.lastActiveToken?.jwt;
            sendResponse({ token: token || null });
          } catch {
            sendResponse({ token: null });
          }
        } else {
          sendResponse({ token: null });
        }
      });
      return true; // Keep channel open for async response
    }

    // Handle different message types
    if (message.type === "OPEN_OVERLAY") {
      // Forward to content script
      if (sender.tab?.id) {
        browser.tabs.sendMessage(sender.tab.id, message);
      }
    }

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
