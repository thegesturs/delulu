import type { Effect } from "effect";
import type {
  MediaType,
  SocialPublishInputType,
  SocialType,
} from "@delulu/validators/post";
import type { ConnectionError } from "./errors";
import type { ConvexClient } from "./services/convex";

/** Every publishable network — excludes the non-publishing sentinels. */
export type PublishableSocialType = Exclude<SocialType, "DEFAULT" | "LENS">;

// ── Meta ──────────────────────────────────────────────────────────────────

export interface PlatformCapabilities {
  publish: boolean;
  analytics: boolean;
  supportsDM: boolean;
  multiStepConnect: boolean;
  supportsThreads: boolean;
  supportsStories: boolean;
  supportsDocuments: boolean;
}

export interface PlatformMeta {
  name: string;
  icon: string;
  editor: "normal" | "markdown" | "minimal";
  capabilities: PlatformCapabilities;
  toolTip?: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export interface ConnectContext {
  /** Instagram-only: opt-in insights scope (admin feature). */
  includeInsights?: boolean;
}

/**
 * Everything the OAuth callback needs. The thin Next.js route resolves the
 * Clerk session + Convex token and hands them in — connections stay free of
 * Clerk/Next dependencies so the module remains workerd-safe.
 */
export interface CallbackContext {
  code: string | null;
  error: string | null;
  errorReason: string | null;
  /** Convex auth token (Clerk `convex` template) for the current user. */
  convexToken: string;
  userId: string;
  /** Optional analytics hook fired on a successful connect. */
  onConnected?: (info: { provider: string; username: string }) => void;
}

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  /** Absolute expiry timestamp (ms epoch). */
  expiresIn: number;
}

export interface PlatformAuth {
  scopes: string[];
  isMultiStep: boolean;
  getConnectUrl(ctx?: ConnectContext): string;
  handleCallback(ctx: CallbackContext): Promise<Response>;
  refreshToken?(input: {
    socialProviderId: string;
    refreshToken: string;
  }): Effect.Effect<TokenRefreshResult, ConnectionError>;
}

// ── Rules ─────────────────────────────────────────────────────────────────

export interface PlatformMediaRules {
  requiresVideo: boolean;
  requiresImage: boolean;
  requiresEither: boolean;
  allowsMultipleImages: boolean;
  allowsMultipleVideos: boolean;
  maxImages?: number;
}

export interface ValidateInput {
  text: string;
  media: MediaType[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PlatformRules {
  maxLength: number | undefined;
  media: PlatformMediaRules;
  validate(input: ValidateInput): ValidationResult;
}

// ── Settings ──────────────────────────────────────────────────────────────

export interface SettingFieldOption {
  value: string;
  label: string;
}

/**
 * Describes ONE user-editable setting so the composer can render an editable
 * control generically from the registry (instead of a bespoke per-platform
 * component). The user's chosen values flow back through
 * `content.providerSettings` and are validated by the Zod schemas in
 * `@delulu/validators` at the publish boundary.
 */
export interface SettingField {
  key: string;
  label: string;
  type: "boolean" | "select" | "text";
  /** Required for `type: "select"`. */
  options?: SettingFieldOption[];
  description?: string;
}

export interface PlatformSettings {
  /** Seed values; the user can override any `fields` entry per post. */
  defaults: unknown;
  /** Must the user configure settings before this platform can post? */
  requiresConfiguration: boolean;
  /** User-editable settings (omitted/empty = no per-post settings). */
  fields?: SettingField[];
}

// ── Optional capabilities ───────────────────────────────────────────────────

export interface PlatformWebhooks {
  subscribe(input: {
    profileId: string;
    accessToken: string;
  }): Effect.Effect<void, ConnectionError>;
}

/** Platform-specific read queries (e.g. Instagram post/story pickers). */
export interface PlatformQueries {
  [key: string]: (
    input: { profileId: string; accessToken: string; limit?: number }
  ) => Effect.Effect<unknown, ConnectionError>;
}

// ── Publish ─────────────────────────────────────────────────────────────────

export interface PostResult {
  platformPostId: string;
  platformPostUrl: string;
  platformId: string;
  postId: string;
  postedAt: Date;
}

export interface PublishContext {
  content: SocialPublishInputType;
  socialProviderId: string;
}

// ── The connection objects ─────────────────────────────────────────────────

/**
 * Isomorphic (workerd-safe) surface of a platform. NOTE: deliberately has NO
 * `publish` — publishing pulls in Node-only deps (axios/googleapis) and lives
 * in `PlatformPublisher`, imported only from the worker entry (Path A).
 */
export interface PlatformConnection {
  id: PublishableSocialType;
  meta: PlatformMeta;
  auth: PlatformAuth;
  rules: PlatformRules;
  settings: PlatformSettings;
  webhooks?: PlatformWebhooks;
  queries?: PlatformQueries;
}

/** Node-only publishing half. Its `R` requires the Convex service. */
export interface PlatformPublisher {
  id: PublishableSocialType;
  publish(
    ctx: PublishContext
  ): Effect.Effect<PostResult, ConnectionError, ConvexClient>;
}
