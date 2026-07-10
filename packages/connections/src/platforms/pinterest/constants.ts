/** Pinterest API v5 base — matches the prior provider + callback route. */
export const API_BASE = "https://api.pinterest.com/v5";

export const PROVIDER = "Pinterest";

/** Caption/description limit — the PINTEREST slice of the old platform-rules. */
export const DESCRIPTION_LIMIT = 500;

/** Pin title is capped at 100 chars (source used `text.slice(0, 100)`). */
export const TITLE_LIMIT = 100;

/** Image count limit — PINTEREST slice of PLATFORM_IMAGE_LIMITS. */
export const MAX_IMAGES = 5;
