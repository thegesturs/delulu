// XHR Interceptor - runs in page context
(function() {
  console.log('[Sorted] 🚀 XHR interceptor loading...');

  window.__sortedMetricsCache = new Map();

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._sortedUrl = url;
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    this.addEventListener('load', function() {
      const url = this._sortedUrl;

      if (url && url.includes('/graphql/query')) {
        console.log('[Sorted] 🎯 GraphQL XHR!');
        try {
          if (this.responseType === '' || this.responseType === 'text') {
            const data = JSON.parse(this.responseText);

            if (data.data?.xdt_api__v1__clips__user__connection_v2) {
              const edges = data.data.xdt_api__v1__clips__user__connection_v2.edges;
              console.log('[Sorted] ✅', edges.length, 'REELS!');

              edges.forEach(edge => {
                const media = edge.node.media;
                if (media.media_type === 2) {
                  const metrics = {
                    views: media.play_count ?? media.view_count,
                    likes: media.like_count,
                    comments: media.comment_count
                  };

                  if (media.code) {
                    window.__sortedMetricsCache.set(media.code, metrics);
                    console.log('[Sorted] 📊', media.code, metrics);

                    // Send message to content script (CRITICAL for cross-world communication)
                    window.postMessage({
                      type: 'SORTED_METRICS_CACHED',
                      reelId: media.code,
                      metrics: metrics
                    }, '*');
                  }
                  if (media.pk) {
                    window.__sortedMetricsCache.set(media.pk, metrics);

                    // Also send for pk
                    window.postMessage({
                      type: 'SORTED_METRICS_CACHED',
                      reelId: media.pk,
                      metrics: metrics
                    }, '*');
                  }
                }
              });
            }
          }
        } catch (e) {
          console.debug('[Sorted] Parse error:', e);
        }
      }
    });

    return originalSend.apply(this, arguments);
  };

  console.log('[Sorted] ✅ XHR interceptor active!');
})();
