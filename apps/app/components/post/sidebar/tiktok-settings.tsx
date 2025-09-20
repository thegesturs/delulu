'use client';

import { useStore } from '@/store/post';
import { api } from '@/trpc/react';
import { Label } from '@delulu/design-system/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@delulu/design-system/components/ui/select';
import { Switch } from '@delulu/design-system/components/ui/switch';
import { cn } from '@delulu/design-system/lib/utils';
import {
  type PromotionContentType,
  type TikTokSettings,
  type TiktokPrivacyLevels,
  promotionContentTypes,
  tikTokPrivacyLevels,
} from '@delulu/validators/post';
import { useCallback, useEffect, useState } from 'react';

interface TikTokSettingsProps {
  hasVideo: boolean;
  providerId: string;
}

export function TikTokSettingsDisplay({
  hasVideo,
  providerId,
}: TikTokSettingsProps) {
  const { setProviderSettings, getProviderSettings } = useStore();
  const providerSetting = getProviderSettings(providerId);
  const tiktokSettings =
    providerSetting?.type === 'TIKTOK' ? providerSetting.settings : undefined;

  // Add state to track if toggle has been turned on (independent of checkboxes)
  const [commercialToggleOn, setCommercialToggleOn] = useState(false);

  // Initialize toggle state based on current settings
  useEffect(() => {
    const hasCommercialContent =
      tiktokSettings?.promotionContent !== promotionContentTypes.NONE;
    setCommercialToggleOn(hasCommercialContent);
  }, [tiktokSettings?.promotionContent]);

  // Helper functions to convert between UI state and enum
  const getCommercialContentState = (
    promotionContent: PromotionContentType
  ) => {
    switch (promotionContent) {
      case promotionContentTypes.NONE:
        return {
          hasCommercialContent: commercialToggleOn, // Use toggle state, not promotion content
          yourBrand: false,
          brandedContent: false,
        };
      case promotionContentTypes.SELF:
        return {
          hasCommercialContent: true,
          yourBrand: true,
          brandedContent: false,
        };
      case promotionContentTypes.PAID:
        return {
          hasCommercialContent: true,
          yourBrand: false,
          brandedContent: true,
        };
      case promotionContentTypes.BOTH:
        return {
          hasCommercialContent: true,
          yourBrand: true,
          brandedContent: true,
        };
      default:
        return {
          hasCommercialContent: commercialToggleOn,
          yourBrand: false,
          brandedContent: false,
        };
    }
  };

  const getPromotionContentFromState = (
    hasCommercialContent: boolean,
    yourBrand: boolean,
    brandedContent: boolean
  ): PromotionContentType => {
    if (!hasCommercialContent) return promotionContentTypes.NONE;

    // If both are selected, return BOTH
    if (yourBrand && brandedContent) return promotionContentTypes.BOTH;
    if (brandedContent) return promotionContentTypes.PAID;
    if (yourBrand) return promotionContentTypes.SELF;

    // This shouldn't happen if validation works, but fallback to NONE
    return promotionContentTypes.NONE;
  };

  // Get current UI state
  const commercialContentState = getCommercialContentState(
    tiktokSettings?.promotionContent || promotionContentTypes.NONE
  );

  // Fetch creator info for this provider to show user context
  const creatorInfo = api.socialProvider.getTikTokCreatorInfo.useQuery(
    { socialProviderId: providerId },
    {
      enabled: !!providerId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    }
  );

  const updateTikTokSettings = useCallback(
    (updates: Partial<TikTokSettings>) => {
      const currentSettings = tiktokSettings || {
        privacy: '' as TiktokPrivacyLevels, // No default - user must select
        allowComments: true, // Enabled by default for better UX
        allowDuet: true, // Enabled by default for better UX
        allowStitch: true, // Enabled by default for better UX
        promotionContent: promotionContentTypes.NONE,
      };

      const newSettings = { ...currentSettings, ...updates };

      // Enforce business rule: paid partnerships can't be private
      if (
        newSettings.promotionContent === promotionContentTypes.PAID &&
        newSettings.privacy === tikTokPrivacyLevels.SELF_ONLY
      ) {
        newSettings.privacy = tikTokPrivacyLevels.PUBLIC_TO_EVERYONE;
      }

      setProviderSettings(providerId, {
        socialProviderId: providerId,
        type: 'TIKTOK',
        settings: newSettings,
      });
    },
    [providerId, setProviderSettings, tiktokSettings]
  );

  // Effect for validation only - no initialization with defaults
  useEffect(() => {
    if (!tiktokSettings) return;

    // Validate and fix paid partnership privacy conflict
    if (
      (tiktokSettings.promotionContent === promotionContentTypes.PAID ||
        tiktokSettings.promotionContent === promotionContentTypes.BOTH) &&
      tiktokSettings.privacy === tikTokPrivacyLevels.SELF_ONLY
    ) {
      updateTikTokSettings({ privacy: tikTokPrivacyLevels.PUBLIC_TO_EVERYONE });
    }
  }, [tiktokSettings, updateTikTokSettings]);

  const handlePrivacyChange = (value: TiktokPrivacyLevels) => {
    updateTikTokSettings({ privacy: value });
  };

  // New handlers for toggle + switches UI
  const handleCommercialContentToggle = (checked: boolean) => {
    setCommercialToggleOn(checked);

    if (checked) {
      // Auto-enable "Your brand" when toggle is turned ON for better UX
      updateTikTokSettings({ promotionContent: promotionContentTypes.SELF });
    } else {
      // Turn off commercial content
      updateTikTokSettings({ promotionContent: promotionContentTypes.NONE });
    }
  };

  const handleYourBrandChange = (checked: boolean) => {
    const { hasCommercialContent, brandedContent } = commercialContentState;
    if (hasCommercialContent) {
      const newPromotionContent = getPromotionContentFromState(
        true,
        checked,
        brandedContent
      );
      updateTikTokSettings({ promotionContent: newPromotionContent });
    }
  };

  const handleBrandedContentChange = (checked: boolean) => {
    const { hasCommercialContent, yourBrand } = commercialContentState;
    if (hasCommercialContent) {
      const newPromotionContent = getPromotionContentFromState(
        true,
        yourBrand,
        checked
      );
      updateTikTokSettings({ promotionContent: newPromotionContent });
    }
  };

  const renderConsentText = () => {
    const hasPaidPromotion =
      tiktokSettings?.promotionContent === promotionContentTypes.PAID;

    return (
      <p className="text-muted-foreground text-xs">
        By posting, you agree to TikTok's{' '}
        {hasPaidPromotion && (
          <>
            <a
              href="https://www.tiktok.com/legal/page/global/bc-policy/en"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Branded Content Policy
            </a>
            {' and '}
          </>
        )}
        <a
          href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Music Usage Confirmation
        </a>
      </p>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold">TikTok Settings</h3>
        {creatorInfo.data && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
            {creatorInfo.data.creator_avatar_url && (
              <img
                src={creatorInfo.data.creator_avatar_url}
                alt={creatorInfo.data.creator_nickname}
                className="h-8 w-8 rounded-full"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-sm">
                  {creatorInfo.data.creator_nickname}
                </p>
              </div>
              <p className="text-muted-foreground text-xs">
                @{creatorInfo.data.creator_username}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Level */}
      <div className="flex justify-between space-y-2">
        <Label htmlFor="tiktok-privacy">Privacy Level</Label>
        <Select
          value={tiktokSettings?.privacy || ''}
          onValueChange={handlePrivacyChange}
        >
          <SelectTrigger id="tiktok-privacy">
            <SelectValue placeholder="Select privacy level" />
          </SelectTrigger>
          <SelectContent>
            {(creatorInfo.data?.privacy_level_options || [
              tikTokPrivacyLevels.PUBLIC_TO_EVERYONE,
              tikTokPrivacyLevels.MUTUAL_FOLLOW_FRIENDS,
              tikTokPrivacyLevels.SELF_ONLY,
            ]).map((option: string) => (
              <SelectItem
                key={option}
                value={option}
                disabled={
                  option === tikTokPrivacyLevels.SELF_ONLY &&
                  tiktokSettings?.promotionContent === promotionContentTypes.PAID
                }
              >
                {option === tikTokPrivacyLevels.PUBLIC_TO_EVERYONE && 'Everyone'}
                {option === tikTokPrivacyLevels.MUTUAL_FOLLOW_FRIENDS && 'Friends'}
                {option === tikTokPrivacyLevels.SELF_ONLY && 'Only me'}
                {option === 'FOLLOWER_OF_CREATOR' && 'Followers'}
                {option === tikTokPrivacyLevels.SELF_ONLY &&
                  tiktokSettings?.promotionContent === promotionContentTypes.PAID && (
                    <span className="ml-2 text-muted-foreground text-xs">
                      (Not available for paid partnerships)
                    </span>
                  )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Interaction Settings */}
      <div className="space-y-2">
        <Label>Interaction Settings</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="allow-comments"
              checked={tiktokSettings?.allowComments ?? false}
              disabled={creatorInfo.data?.comment_disabled}
              onCheckedChange={(checked) =>
                updateTikTokSettings({ allowComments: !!checked })
              }
            />
            <Label
              htmlFor="allow-comments"
              className="cursor-pointer font-normal text-sm"
            >
              Allow Comments
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allow-duet"
              checked={tiktokSettings?.allowDuet ?? false}
              disabled={!hasVideo || creatorInfo.data?.duet_disabled}
              onCheckedChange={(checked) =>
                updateTikTokSettings({ allowDuet: !!checked })
              }
            />
            <Label
              htmlFor="allow-duet"
              className={cn(
                'cursor-pointer font-normal text-sm',
                !hasVideo && 'cursor-not-allowed opacity-50'
              )}
            >
              Allow Duet
              {!hasVideo && (
                <span className="ml-2 text-muted-foreground text-xs">
                  (Video only)
                </span>
              )}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allow-stitch"
              checked={tiktokSettings?.allowStitch ?? false}
              disabled={!hasVideo || creatorInfo.data?.stitch_disabled}
              onCheckedChange={(checked) =>
                updateTikTokSettings({ allowStitch: !!checked })
              }
            />
            <Label
              htmlFor="allow-stitch"
              className={cn(
                'cursor-pointer font-normal text-sm',
                !hasVideo && 'cursor-not-allowed opacity-50'
              )}
            >
              Allow Stitch
              {!hasVideo && (
                <span className="ml-2 text-muted-foreground text-xs">
                  (Video only)
                </span>
              )}
            </Label>
          </div>
        </div>
      </div>

      {/* Commercial Content Disclosure */}
      <div className="space-y-3">
        <div>
          <Label>Commercial Content Disclosure</Label>
          <p className="mt-1 text-muted-foreground text-xs">
            Indicate whether this content promotes yourself, a brand, product or
            service
          </p>
        </div>

        {/* Main Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="commercial-content-toggle"
            checked={commercialContentState.hasCommercialContent}
            onCheckedChange={handleCommercialContentToggle}
          />
          <Label
            htmlFor="commercial-content-toggle"
            className="cursor-pointer font-normal text-sm"
          >
            Content Disclosure Setting
          </Label>
        </div>

        {/* Switches when toggle is enabled */}
        {commercialContentState.hasCommercialContent && (
          <div className="ml-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="your-brand"
                  className="cursor-pointer font-normal text-sm"
                >
                  Your brand
                </Label>
                <p className="text-muted-foreground text-xs">
                  You are promoting yourself or your own business
                </p>
                {commercialContentState.yourBrand && (
                  <p className="text-blue-600 text-xs">
                    Your photo/video will be labeled as "Promotional content"
                  </p>
                )}
              </div>
              <Switch
                id="your-brand"
                checked={commercialContentState.yourBrand}
                onCheckedChange={handleYourBrandChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="branded-content"
                  className="cursor-pointer font-normal text-sm"
                >
                  Branded content
                </Label>
                <p className="text-muted-foreground text-xs">
                  You are promoting another brand or a third party
                </p>
                {commercialContentState.brandedContent && (
                  <p className="text-blue-600 text-xs">
                    Your photo/video will be labeled as "Paid partnership"
                  </p>
                )}
              </div>
              <Switch
                id="branded-content"
                checked={commercialContentState.brandedContent}
                onCheckedChange={handleBrandedContentChange}
              />
            </div>

            {/* Validation message */}
            {commercialContentState.hasCommercialContent &&
              !commercialContentState.yourBrand &&
              !commercialContentState.brandedContent && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-amber-800 text-xs">
                    ⚠️ You need to indicate if your content promotes yourself, a
                    third party, or both.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Consent Declaration */}
      <div className="rounded-md bg-muted/50 p-3">{renderConsentText()}</div>
    </div>
  );
}
