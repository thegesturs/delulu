import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Sorted - Instagram Reel Sorter",
    description:
      "Sort Instagram reels by likes, views, or comments. Find the most engaging content instantly.",
    version: "1.1.0",
    homepage_url: "https://delulu.social",
    permissions: ["activeTab"],
    host_permissions: ["*://www.instagram.com/*", "*://instagram.com/*"],
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
