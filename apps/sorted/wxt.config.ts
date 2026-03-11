import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  dev: {
    server: {
      port: 3200,
    },
  },
  modules: ["@wxt-dev/module-react"],
  manifest: {
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu+cZSTBVKamxqcobsVTOIjWTEzWS7lPJMVKD/gJ4fqCO5/ftGu6ivr0VA/gyxfA0pWKy0IcFmbTDzeDIsEEogDfWpw9sZoA/Gcq3d+pKU0Gc1RQws6JqmQaSiZtwrqrzDbMZwC+0bKlcqMkOCrPz98HTYQERulJBv3l74w+0jJwsx2/X3NDvq5utnAc0Bb8FPaXCQQ7uXcqF6WhZsFdeDZ6n8UW6kFZYnf4/AMXBQXyZzf9efcjNJef/rkLR76P+H1uDSoRGT2Rr5Zs1xeXQ2yLW5KDEOBisJ5YzVY0Ye3h49rQm1dV2unGLqpW6HL9SGR+GQQDTcvZaCHkQLX3YvwIDAQAB",
    name: "Sorted - Instagram Reel Sorter",
    description:
      "Sort Instagram reels by likes, views, or comments. Find the most engaging content instantly.",
    version: "1.2.0",
    homepage_url: "https://delulu.social",
    permissions: ["activeTab", "cookies", "storage"],
    host_permissions: [
      "*://www.instagram.com/*",
      "*://instagram.com/*",
      "https://clerk.delulu.social/*",
      "https://rapid-doe-87.clerk.accounts.dev/*",
      "http://localhost/*",
      "https://solulu.delulu.social/*",
    ],
    action: {
      default_title: "Sorted - Instagram Reel Sorter",
      default_popup: "popup.html",
    },
    icons: {
      16: "icon/16.png",
      48: "icon/48.png",
      128: "icon/128.png",
    },
    web_accessible_resources: [
      {
        resources: ["interceptor.js"],
        matches: ["*://www.instagram.com/*", "*://instagram.com/*"],
      },
    ],
  },
});
