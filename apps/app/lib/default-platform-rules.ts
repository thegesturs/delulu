import type { FullPostType, SocialProviderType } from '@delulu/validators/post';
import { SocialTypes } from '@delulu/validators/post';
import type { SocialType } from '@delulu/validators/post';

/**
 * Determines which platforms are included in the "Default" content
 * (i.e., selected platforms that don't have alternative content)
 */
export function getPlatformsInDefault(
  selectedProviders: SocialProviderType[],
  alternativeContent: FullPostType['alternativeContent']
): SocialType[] {
  // Get IDs of platforms with alternative content
  const alternativeProviderIds = new Set(
    alternativeContent.map((alt) => alt.socialProvider.socialId)
  );

  // Return social types of selected providers that DON'T have alternative content
  return selectedProviders
    .filter((provider) => !alternativeProviderIds.has(provider.socialId))
    .map((provider) => provider.socialType);
}

/**
 * Determines if Default should use video-only layout
 * True if ONLY video platforms (TikTok, YouTube, Instagram Reels) are in default
 */
export function shouldDefaultUseVideoLayout(
  platformsInDefault: SocialType[]
): boolean {
  if (platformsInDefault.length === 0) return false;

  const videoPlatforms = [SocialTypes.TIKTOK, SocialTypes.YOUTUBE];

  // Check if all platforms in default are video platforms
  return platformsInDefault.every((platform) =>
    videoPlatforms.includes(platform)
  );
}

/**
 * Gets the most restrictive character limit from platforms in default
 */
export function getDefaultCharacterLimit(
  platformsInDefault: SocialType[]
): number | undefined {
  if (platformsInDefault.length === 0) return undefined;

  const limits: Record<SocialType, number> = {
    [SocialTypes.TWITTER]: 280,
    [SocialTypes.THREADS]: 500,
    [SocialTypes.INSTAGRAM]: 2200,
    [SocialTypes.TIKTOK]: 2200,
    [SocialTypes.YOUTUBE]: 5000,
    [SocialTypes.LINKEDIN]: 3000,
    [SocialTypes.FACEBOOK]: 63206,
    [SocialTypes.PINTEREST]: 500,
    [SocialTypes.FARCASTER]: 320,
    [SocialTypes.BLUESKY]: 300,
    [SocialTypes.LENS]: 500,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    [SocialTypes.DEFAULT]: undefined as any,
  };

  const platformLimits = platformsInDefault
    .map((platform) => limits[platform])
    .filter((limit): limit is number => limit !== undefined);

  return platformLimits.length > 0 ? Math.min(...platformLimits) : undefined;
}

/**
 * Gets the most restrictive image count from platforms in default
 */
export function getDefaultMaxImages(platformsInDefault: SocialType[]): number {
  if (platformsInDefault.length === 0) return 4; // Default fallback

  const limits: Record<SocialType, number> = {
    [SocialTypes.TWITTER]: 4,
    [SocialTypes.LINKEDIN]: 4,
    [SocialTypes.FACEBOOK]: 10,
    [SocialTypes.INSTAGRAM]: 10,
    [SocialTypes.PINTEREST]: 5,
    [SocialTypes.TIKTOK]: 1, // Thumbnail only
    [SocialTypes.YOUTUBE]: 1, // Thumbnail only
    [SocialTypes.THREADS]: 10,
    [SocialTypes.FARCASTER]: 2,
    [SocialTypes.BLUESKY]: 4,
    [SocialTypes.LENS]: 4,
    [SocialTypes.DEFAULT]: 4,
  };

  const platformLimits = platformsInDefault.map((platform) => limits[platform]);

  return Math.min(...platformLimits);
}

/**
 * Checks if YouTube is in default (to show title field)
 */
export function shouldShowYouTubeTitle(
  platformsInDefault: SocialType[]
): boolean {
  return platformsInDefault.includes(SocialTypes.YOUTUBE);
}

/**
 * Gets placeholder text based on primary platform in default
 */
export function getDefaultPlaceholder(
  platformsInDefault: SocialType[]
): string {
  if (platformsInDefault.length === 0) return "What's on your mind?";

  // Priority order for placeholder text
  const platform = platformsInDefault[0];

  const placeholders: Record<SocialType, string> = {
    [SocialTypes.TWITTER]: "What's happening?",
    [SocialTypes.TIKTOK]: 'Write a catchy caption for your TikTok...',
    [SocialTypes.YOUTUBE]: 'Describe your YouTube Short...',
    [SocialTypes.INSTAGRAM]: 'Write a caption for your post...',
    [SocialTypes.LINKEDIN]: 'Share your professional update...',
    [SocialTypes.FACEBOOK]: "What's on your mind?",
    [SocialTypes.THREADS]: "What's on your mind?",
    [SocialTypes.PINTEREST]: 'Describe your pin...',
    [SocialTypes.FARCASTER]: 'Share your thoughts...',
    [SocialTypes.BLUESKY]: "What's up?",
    [SocialTypes.LENS]: 'Share with your community...',
    [SocialTypes.DEFAULT]: "What's on your mind?",
  };

  return placeholders[platform] || "What's on your mind?";
}

/**
 * Checks if any platform in default requires video
 */
export function doesDefaultRequireVideo(
  platformsInDefault: SocialType[]
): boolean {
  const videoRequiredPlatforms: SocialType[] = [
    SocialTypes.TIKTOK,
    SocialTypes.YOUTUBE,
  ];
  return platformsInDefault.some((platform) =>
    videoRequiredPlatforms.includes(platform)
  );
}
