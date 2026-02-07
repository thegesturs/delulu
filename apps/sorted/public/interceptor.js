// XHR Interceptor - runs in page context
(() => {
  window.__sortedMetricsCache = new Map();

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (_method, url) {
    this._sortedUrl = url;
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (_body) {
    this.addEventListener("load", function () {
      const url = this._sortedUrl;

      if (url?.includes("/graphql/query")) {
        try {
          if (this.responseType === "" || this.responseType === "text") {
            const data = JSON.parse(this.responseText);

            if (data.data?.xdt_api__v1__clips__user__connection_v2) {
              const edges =
                data.data.xdt_api__v1__clips__user__connection_v2.edges;

              edges.forEach((edge) => {
                const media = edge.node.media;
                if (media.media_type === 2) {
                  const metrics = {
                    views: media.play_count ?? media.view_count,
                    likes: media.like_count,
                    comments: media.comment_count,
                  };

                  if (media.code) {
                    window.__sortedMetricsCache.set(media.code, metrics);

                    // Send message to content script (CRITICAL for cross-world communication)
                    window.postMessage(
                      {
                        type: "SORTED_METRICS_CACHED",
                        reelId: media.code,
                        metrics,
                      },
                      "*"
                    );
                  }
                  if (media.pk) {
                    window.__sortedMetricsCache.set(media.pk, metrics);

                    // Also send for pk
                    window.postMessage(
                      {
                        type: "SORTED_METRICS_CACHED",
                        reelId: media.pk,
                        metrics,
                      },
                      "*"
                    );
                  }
                }
              });
            }
          }
        } catch (_e) {
          // Silent fail
        }
      }
    });

    return originalSend.apply(this, arguments);
  };
})();
