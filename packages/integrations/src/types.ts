import type { Effect } from "effect";
import type {
  MediaType,
  SocialPublishInputType,
  SocialType,
} from "@delulu/validators/post";
import type { IntegrationError } from "./errors";
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
 * Clerk session + Convex token and hands them in — integrations stay free of
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
  }): Effect.Effect<TokenRefreshResult, IntegrationError>;
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

export interface PlatformSettings {
  defaults: unknown;
  requiresConfiguration: boolean;
}

// ── Optional capabilities ───────────────────────────────────────────────────

export interface PlatformWebhooks {
  subscribe(input: {
    profileId: string;
    accessToken: string;
  }): Effect.Effect<void, IntegrationError>;
}

/** Platform-specific read queries (e.g. Instagram post/story pickers). */
export interface PlatformQueries {
  [key: string]: (
    input: { profileId: string; accessToken: string; limit?: number }
  ) => Effect.Effect<unknown, IntegrationError>;
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

// ── The integration objects ─────────────────────────────────────────────────

/**
 * Isomorphic (workerd-safe) surface of a platform. NOTE: deliberately has NO
 * `publish` — publishing pulls in Node-only deps (axios/googleapis) and lives
 * in `PlatformPublisher`, imported only from the worker entry (Path A).
 */
export interface PlatformIntegration {
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
  ): Effect.Effect<PostResult, IntegrationError, ConvexClient>;
}
