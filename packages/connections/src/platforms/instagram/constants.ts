/** Graph API version for publish + read queries (matches the prior provider). */
export const GRAPH_VERSION = "v23.0";

/**
 * Webhook subscribe stays on v24.0 to preserve the exact behaviour of the
 * current callback route (subscribed_apps for comments,messages). Kept separate
 * from GRAPH_VERSION intentionally — see spec correction B6.
 */
export const WEBHOOK_VERSION = "v24.0";

export const PROVIDER = "Instagram";
export const CAPTION_LIMIT = 2200;
export const MAX_CAROUSEL_IMAGES = 10;
