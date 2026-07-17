/**
 * Centralized analytics event names for PostHog tracking.
 * All event names used across the app should be defined here
 * to ensure consistency and easy discoverability in PostHog.
 */

// ─── Signup & Auth ───
export const SIGNUP_COMPLETED = "signup_completed";
export const USER_SIGNED_IN = "user_signed_in";
export const USER_SIGNED_OUT = "user_signed_out";

// ─── Onboarding (already tracked in use-onboarding.ts) ───
export const ONBOARDING_STEP_COMPLETED = "onboarding_step_completed";
export const ONBOARDING_STEP_SKIPPED = "onboarding_step_skipped";
export const ONBOARDING_COMPLETED = "onboarding_completed";
export const ONBOARDING_SURVEY_COMPLETED = "onboarding_survey_completed";
export const ONBOARDING_TOUR_COMPLETED = "onboarding_tour_completed";
export const ONBOARDING_TOUR_DISMISSED = "onboarding_tour_dismissed";

// ─── Post Creation ───
export const POST_CREATED = "post_created";
export const POST_SCHEDULED = "post_scheduled";
export const POST_SAVED_AS_DRAFT = "post_saved_as_draft";
export const POST_UPDATED = "post_updated";
export const POST_DELETED = "post_deleted";
export const POST_PUBLISHED = "post_published";
export const POST_PUBLISH_FAILED = "post_publish_failed";
export const POST_PUBLISH_RETRIED = "post_publish_retried";
export const POST_RESCHEDULED = "post_rescheduled";
export const BULK_UPLOAD_SCHEDULED = "bulk_upload_scheduled";

// ─── Social Media Connections ───
export const SOCIAL_ACCOUNT_CONNECTED = "social_account_connected";
export const SOCIAL_ACCOUNT_DISCONNECTED = "social_account_disconnected";
export const SOCIAL_ACCOUNT_CONNECTION_FAILED =
  "social_account_connection_failed";

// ─── Reviews / Approval Queue ───
export const REVIEW_ACTIONED = "review_actioned";

// ─── Team / Collaboration ───
export const MEMBER_INVITED = "member_invited";

// ─── Developer / API Keys ───
export const API_KEY_CREATED = "api_key_created";

// ─── Automations / Auto DMs ───
export const AUTOMATION_CREATED = "automation_created";
export const AUTOMATION_UPDATED = "automation_updated";
export const AUTOMATION_DELETED = "automation_deleted";
export const AUTOMATION_TOGGLED = "automation_toggled";

// ─── Billing ───
export const CHECKOUT_INITIATED = "checkout_initiated";
export const SUBSCRIPTION_UPGRADED = "subscription_upgraded";

// ─── Media ───
export const MEDIA_UPLOADED = "media_uploaded";

// ─── Feature Usage ───
export const FEATURE_USED = "feature_used";
export const PAGE_VIEWED = "page_viewed";

// ─── Retention / Session ───
export const SESSION_STARTED = "session_started";
export const APP_OPENED = "app_opened";

// ─── CLI ───
export const CLI_COMMAND_INVOKED = "cli_command_invoked";
