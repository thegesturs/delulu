/**
 * GraphQL API Interceptor
 * Intercepts Instagram's GraphQL API responses to extract reel metrics
 * Based on SortFeed's approach
 */

import type { ReelMetrics } from '../../shared/types';

interface GraphQLReelData {
  pk?: string;
  code?: string;
  media_type?: number;
  play_count?: number;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
}

interface GraphQLResponse {
  data?: {
    xdt_api__v1__clips__user__connection_v2?: {
      edges: Array<{
        node: {
          media: GraphQLReelData;
        };
      }>;
    };
    xdt_api__v1__feed__user_timeline_graphql_connection?: {
      edges: Array<{
        node: GraphQLReelData;
      }>;
    };
  };
}

// Store metrics by reel ID
const metricsCache = new Map<string, ReelMetrics>();

/**
 * Get cached metrics for a reel
 * Reads from content script cache (populated via postMessage from MAIN world)
 */
export function getCachedMetrics(reelId: string): ReelMetrics | undefined {
  return metricsCache.get(reelId);
}

/**
 * Clear metrics cache
 */
export function clearMetricsCache(): void {
  metricsCache.clear();
}

/**
 * Extract metrics from GraphQL reel data
 */
function extractMetrics(data: GraphQLReelData): ReelMetrics {
  return {
    views: data.play_count ?? data.view_count,
    likes: data.like_count,
    comments: data.comment_count,
  };
}

/**
 * Process GraphQL response and cache metrics
 */
function processGraphQLResponse(response: GraphQLResponse): void {
  // Check for reels data
  if (response.data?.xdt_api__v1__clips__user__connection_v2) {
    const edges = response.data.xdt_api__v1__clips__user__connection_v2.edges;

    for (const edge of edges) {
      const media = edge.node.media;
      if (media.media_type === 2 && media.pk) { // media_type 2 = video (reel)
        const metrics = extractMetrics(media);
        metricsCache.set(media.pk, metrics);

        // Also cache by code if available
        if (media.code) {
          metricsCache.set(media.code, metrics);
        }

        console.log('[Sorted] Cached metrics for reel:', media.code || media.pk, metrics);
      }
    }
  }

  // Check for posts/feed data
  if (response.data?.xdt_api__v1__feed__user_timeline_graphql_connection) {
    const edges = response.data.xdt_api__v1__feed__user_timeline_graphql_connection.edges;

    for (const edge of edges) {
      const node = edge.node;
      if (node.pk) {
        const metrics = extractMetrics(node);
        metricsCache.set(node.pk, metrics);

        // Also cache by code if available
        if (node.code) {
          metricsCache.set(node.code, metrics);
        }

        console.log('[Sorted] Cached metrics for post:', node.code || node.pk, metrics);
      }
    }
  }
}

/**
 * Initialize GraphQL interception
 * The actual interceptor runs in interceptor.js (MAIN world)
 * This listens for postMessage events from the MAIN world
 */
export function initializeGraphQLInterceptor(): void {
  console.log('[Sorted] GraphQL interceptor ready - listening for messages from MAIN world');

  // Listen for metrics from the MAIN world interceptor
  window.addEventListener('message', (event) => {
    if (event.source !== window) return; // Only accept messages from same window

    if (event.data.type === 'SORTED_METRICS_CACHED') {
      const { reelId, metrics } = event.data;
      metricsCache.set(reelId, metrics);
      console.log('[Sorted] 📥 Received metrics from MAIN world:', reelId, metrics);
    }
  });

  // Keep backup fetch interceptor in isolated world
  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

    // Log EVERY fetch request
    console.log('[Sorted] Fetch:', url?.substring(0, 150));

    // Call original fetch
    const response = await originalFetch.apply(this, args);

    // Clone response so we can read it without consuming the original
    const clonedResponse = response.clone();

    // Only process GraphQL requests
    if (url && url.includes('/graphql/query')) {
      console.log('[Sorted] 🎯 Intercepted GraphQL fetch:', url.substring(0, 100));
      try {
        const data = await clonedResponse.json() as GraphQLResponse;

        // Check if this response contains reel data
        if (data.data?.xdt_api__v1__clips__user__connection_v2) {
          const reelCount = data.data.xdt_api__v1__clips__user__connection_v2.edges.length;
          console.log('[Sorted] ✅ Intercepted GraphQL response with', reelCount, 'REELS');
          processGraphQLResponse(data);
        } else if (data.data?.xdt_api__v1__feed__user_timeline_graphql_connection) {
          const postCount = data.data.xdt_api__v1__feed__user_timeline_graphql_connection.edges.length;
          console.log('[Sorted] ✅ Intercepted GraphQL response with', postCount, 'POSTS');
          processGraphQLResponse(data);
        }
      } catch (error) {
        console.debug('[Sorted] Failed to parse fetch response:', error);
      }
    }

    return response;
  };

  // Also keep XHR interception as fallback
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  // Override open to capture the URL
  XMLHttpRequest.prototype.open = function(
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    // Store URL for later use
    (this as any)._url = url.toString();
    return originalOpen.apply(this, arguments as any);
  };

  // Override send to capture the response
  XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
    // Add load listener to process response
    this.addEventListener('load', function() {
      const url = (this as any)._url;

      // Log EVERY SINGLE XHR request to debug
      console.log('[Sorted] XHR:', url?.substring(0, 150));

      // Only process GraphQL requests
      if (url && url.includes('/graphql/query')) {
        console.log('[Sorted] Intercepted GraphQL request:', url.substring(0, 100));
        try {
          // Only process text/json responses
          if (this.responseType === '' || this.responseType === 'text') {
            const response = JSON.parse(this.responseText) as GraphQLResponse;

            // Check if this response contains reel data
            if (response.data?.xdt_api__v1__clips__user__connection_v2) {
              const reelCount = response.data.xdt_api__v1__clips__user__connection_v2.edges.length;
              console.log('[Sorted] ✅ Intercepted GraphQL response with', reelCount, 'REELS');
              processGraphQLResponse(response);
            } else if (response.data?.xdt_api__v1__feed__user_timeline_graphql_connection) {
              const postCount = response.data.xdt_api__v1__feed__user_timeline_graphql_connection.edges.length;
              console.log('[Sorted] ✅ Intercepted GraphQL response with', postCount, 'POSTS');
              processGraphQLResponse(response);
            }
          }
        } catch (error) {
          // Ignore JSON parse errors
          console.debug('[Sorted] Failed to parse GraphQL response:', error);
        }
      }
    });

    return originalSend.apply(this, arguments as any);
  };

  console.log('[Sorted] ✅ GraphQL interceptor initialized');
}

/**
 * Cleanup interceptor (restore original methods)
 */
export function cleanupGraphQLInterceptor(): void {
  // Note: In practice, we can't easily restore the original methods
  // since we've already overridden them. This is acceptable for an extension.
  clearMetricsCache();
  console.log('[Sorted] GraphQL interceptor cleaned up');
}
