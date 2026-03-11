/**
 * Main world content script - runs in the same JS context as Instagram
 * This allows us to intercept XHR/fetch requests
 */

export default defineContentScript({
  matches: ["*://www.instagram.com/*", "*://instagram.com/*"],
  world: "MAIN", // Run in page context, not isolated world
  runAt: "document_start", // Run as early as possible

  main() {
    console.log("[Sorted] Main world interceptor loaded");

    // Cache for metrics by reel ID
    const metricsCache = new Map();
    let takeoverActive = false;

    // Listen for takeover signal from content script
    window.addEventListener("message", (event) => {
      if (event.data?.type === "SORTED_TAKEOVER") {
        takeoverActive = true;
        console.log("[Sorted] Takeover active — suppressing reel-loading XHR");
      }
      if (event.data?.type === "SORTED_TAKEOVER_RESET") {
        takeoverActive = false;
      }
    });

    // Expose cache to isolated world via window
    // biome-ignore lint/suspicious/noExplicitAny: window extension requires any
    (window as any).__sortedMetricsCache = metricsCache;

    /**
     * Cache metrics and notify the isolated world via postMessage
     */
    // biome-ignore lint/suspicious/noExplicitAny: metrics shape is dynamic
    function cacheAndNotify(reelId: string, metrics: any) {
      metricsCache.set(reelId, metrics);
      window.postMessage(
        { type: "SORTED_METRICS_CACHED", reelId, metrics },
        "*"
      );
    }

    // Hook XHR (Instagram uses this!)
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (
      _method: string,
      url: string | URL,
      ...rest: unknown[]
    ) {
      // biome-ignore lint/suspicious/noExplicitAny: XMLHttpRequest extension requires any
      (this as any)._url = url.toString();
      // biome-ignore lint/complexity/noArguments: XMLHttpRequest override requires rest params
      // biome-ignore lint/suspicious/noExplicitAny: XMLHttpRequest override requires any
      return originalOpen.apply(this, [_method, url, ...rest] as any);
    };

    XMLHttpRequest.prototype.send = function (
      _body?: Document | XMLHttpRequestBodyInit | null
    ) {
      // Suppress reel-loading XHR after takeover to prevent wasted network traffic
      // biome-ignore lint/suspicious/noExplicitAny: XMLHttpRequest extension requires any
      const requestUrl = (this as any)._url as string | undefined;
      if (
        takeoverActive &&
        requestUrl?.includes("/graphql/query") &&
        requestUrl?.includes("clips")
      ) {
        console.log(
          "[Sorted] Suppressed reel-loading XHR:",
          requestUrl.substring(0, 100)
        );
        this.abort();
        return;
      }

      this.addEventListener("load", function () {
        // biome-ignore lint/suspicious/noExplicitAny: XMLHttpRequest extension requires any
        const url = (this as any)._url;

        // Log all XHR for debugging
        if (url) {
          console.log("[Sorted] XHR:", url.substring(0, 150));
        }

        if (url?.includes("/graphql/query")) {
          console.log("[Sorted] 🎯 Found GraphQL XHR!");
          try {
            if (this.responseType === "" || this.responseType === "text") {
              const data = JSON.parse(this.responseText);

              // Check for reels
              if (data.data?.xdt_api__v1__clips__user__connection_v2) {
                const edges =
                  data.data.xdt_api__v1__clips__user__connection_v2.edges;
                console.log(
                  "[Sorted] ✅ Found",
                  edges.length,
                  "REELS in GraphQL response!"
                );

                // biome-ignore lint/suspicious/noExplicitAny: Instagram API response type is dynamic
                edges.forEach((edge: any) => {
                  const media = edge.node.media;
                  if (media.media_type === 2) {
                    const metrics = {
                      views: media.play_count ?? media.view_count,
                      likes: media.like_count,
                      comments: media.comment_count,
                      videoUrl: media.video_versions?.[0]?.url,
                    };

                    if (media.code) {
                      cacheAndNotify(media.code, metrics);
                      console.log(
                        "[Sorted] 📊 Cached metrics for",
                        media.code,
                        metrics
                      );
                    }
                    if (media.pk) {
                      cacheAndNotify(media.pk, metrics);
                    }
                  }
                });
              }

              // Check for posts
              if (
                data.data?.xdt_api__v1__feed__user_timeline_graphql_connection
              ) {
                const edges =
                  data.data.xdt_api__v1__feed__user_timeline_graphql_connection
                    .edges;
                console.log(
                  "[Sorted] ✅ Found",
                  edges.length,
                  "POSTS in GraphQL response!"
                );

                // biome-ignore lint/suspicious/noExplicitAny: Instagram API response type is dynamic
                edges.forEach((edge: any) => {
                  const node = edge.node;
                  const metrics = {
                    views: node.play_count ?? node.view_count,
                    likes: node.like_count,
                    comments: node.comment_count,
                    videoUrl: node.video_versions?.[0]?.url,
                  };

                  if (node.code) {
                    cacheAndNotify(node.code, metrics);
                    console.log(
                      "[Sorted] 📊 Cached metrics for",
                      node.code,
                      metrics
                    );
                  }
                  if (node.pk) {
                    cacheAndNotify(node.pk, metrics);
                  }
                });
              }
            }
          } catch (e) {
            console.debug("[Sorted] Parse error:", e);
          }
        }
      });

      // biome-ignore lint/complexity/noArguments: XMLHttpRequest override requires rest params
      // biome-ignore lint/suspicious/noExplicitAny: XMLHttpRequest override requires any
      return originalSend.apply(this, [_body] as any);
    };

    console.log("[Sorted] ✅ XHR interceptor hooked in main world!");
  },
});
