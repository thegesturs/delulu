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
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAj/u/XDdjlDyw7gHEtaaasZ9GdG8WOKAyJzXd8HFrDtz2Jcuy7er7MtWvHgNDA0bwpznbI5YdZeV4UfCEsA4SrA5b3MnWTHwA1bgbiDM+L9rrqvcadcKuOlTeN48Q0ijmhHlNFbTzvT9W0zw/GKv8LgXAHggxtmHQ/Z9PP2QNF5O8rUHHSL4AJ6hNcEKSBVSmbbjeVm4gSXDuED5r0nwxvRtupDxGYp8IZpP5KlExqNu1nbkPc+igCTIB6XsqijagzxewUHCdovmkb2JNtskx/PMIEv+TvWIx2BzqGp71gSh/dV7SJ3rClvWd2xj8dtxG8FfAWDTIIi0qZXWn2QhizQIDAQAB",
    name: "Sorted - Instagram Reel Sorter",
    description:
      "Sort Instagram reels by likes, views, or comments. Find the most engaging content instantly.",
    version: "2.0.0",
    homepage_url: "https://delulu.social",
    permissions: ["activeTab", "cookies", "storage"],
    host_permissions: [
      "*://www.instagram.com/*",
      "*://instagram.com/*",
      "https://*.delulu.social/*",
      "https://rapid-doe-87.clerk.accounts.dev/*",
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
