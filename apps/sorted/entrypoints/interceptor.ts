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

    // Expose cache to isolated world via window
    (window as any).__sortedMetricsCache = metricsCache;

    // Hook XHR (Instagram uses this!)
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (
      _method: string,
      url: string | URL
    ) {
      (this as any)._url = url.toString();
      return originalOpen.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.send = function (
      _body?: Document | XMLHttpRequestBodyInit | null
    ) {
      this.addEventListener("load", function () {
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

                edges.forEach((edge: any) => {
                  const media = edge.node.media;
                  if (media.media_type === 2) {
                    const metrics = {
                      views: media.play_count ?? media.view_count,
                      likes: media.like_count,
                      comments: media.comment_count,
                    };

                    if (media.code) {
                      metricsCache.set(media.code, metrics);
                      console.log(
                        "[Sorted] 📊 Cached metrics for",
                        media.code,
                        metrics
                      );
                    }
                    if (media.pk) {
                      metricsCache.set(media.pk, metrics);
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

                edges.forEach((edge: any) => {
                  const node = edge.node;
                  const metrics = {
                    views: node.play_count ?? node.view_count,
                    likes: node.like_count,
                    comments: node.comment_count,
                  };

                  if (node.code) {
                    metricsCache.set(node.code, metrics);
                    console.log(
                      "[Sorted] 📊 Cached metrics for",
                      node.code,
                      metrics
                    );
                  }
                  if (node.pk) {
                    metricsCache.set(node.pk, metrics);
                  }
                });
              }
            }
          } catch (e) {
            console.debug("[Sorted] Parse error:", e);
          }
        }
      });

      return originalSend.apply(this, arguments as any);
    };

    console.log("[Sorted] ✅ XHR interceptor hooked in main world!");
  },
});
