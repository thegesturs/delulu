"use client";

import {
  Alert,
  AlertDescription,
} from "@delulu/design-system/components/ui/alert";
import { Label } from "@delulu/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@delulu/design-system/components/ui/select";
import { Switch } from "@delulu/design-system/components/ui/switch";
import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import { DEFAULT_TIKTOK_SETTINGS } from "@delulu/validators/constants/settings";
import {
  type PromotionContentType,
  promotionContentTypes,
  type TikTokSettings,
  type TiktokPrivacyLevels,
  tikTokPrivacyLevels,
} from "@delulu/validators/post";
import { InformationCircleIcon } from "@hugeicons-pro/core-solid-rounded";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/store/post";
import { api } from "@/trpc/react";
import { TikTokConsentBanner } from "./tiktok-consent-banner";

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
    providerSetting?.type === "TIKTOK" ? providerSetting.settings : undefined;

  // Track if settings have been initialized
  const isInitialized = useRef(false);

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
    if (!hasCommercialContent) {
      return promotionContentTypes.NONE;
    }

    // If both are selected, return BOTH
    if (yourBrand && brandedContent) {
      return promotionContentTypes.BOTH;
    }
    if (brandedContent) {
      return promotionContentTypes.PAID;
    }
    if (yourBrand) {
      return promotionContentTypes.SELF;
    }

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
      staleTime: 15 * 60 * 1000, // 15 minutes cache
      retry: false,
    }
  );

  const updateTikTokSettings = useCallback(
    (updates: Partial<TikTokSettings>) => {
      // Get the default privacy based on available options
      const defaultPrivacy =
        (creatorInfo.data?.privacy_level_options?.[0] as TiktokPrivacyLevels) ||
        DEFAULT_TIKTOK_SETTINGS.privacy;

      const currentSettings = tiktokSettings || {
        ...DEFAULT_TIKTOK_SETTINGS,
        privacy: defaultPrivacy, // Override privacy with API-provided default
      };

      const newSettings = { ...currentSettings, ...updates };

      // ALWAYS ensure privacy is never null or empty
      if (!newSettings.privacy) {
        newSettings.privacy = defaultPrivacy;
      }

      // Enforce business rule: paid partnerships can't be private
      if (
        (newSettings.promotionContent === promotionContentTypes.PAID ||
          newSettings.promotionContent === promotionContentTypes.BOTH) &&
        newSettings.privacy === tikTokPrivacyLevels.SELF_ONLY
      ) {
        // Set to the most public option available
        newSettings.privacy =
          (creatorInfo.data
            ?.privacy_level_options?.[0] as TiktokPrivacyLevels) ||
          tikTokPrivacyLevels.PUBLIC_TO_EVERYONE;
        // Notify user about the automatic correction
        toast.info(
          "Privacy changed to Public - Branded content cannot be set to private"
        );
      }

      setProviderSettings(providerId, {
        socialProviderId: providerId,
        type: "TIKTOK",
        settings: newSettings,
      });
    },
    [providerId, setProviderSettings, tiktokSettings, creatorInfo.data]
  );

  // Initialize settings only once when we have creator data
  useEffect(() => {
    if (!(isInitialized.current || tiktokSettings) && creatorInfo.data) {
      isInitialized.current = true;
      const defaultPrivacy =
        (creatorInfo.data.privacy_level_options?.[0] as TiktokPrivacyLevels) ||
        DEFAULT_TIKTOK_SETTINGS.privacy;
      updateTikTokSettings({
        ...DEFAULT_TIKTOK_SETTINGS,
        privacy: defaultPrivacy,
      });
    }
  }, [creatorInfo.data, tiktokSettings, updateTikTokSettings]); // Include all dependencies

  // Validate that stored privacy is available in API options
  useEffect(() => {
    if (
      tiktokSettings?.privacy &&
      creatorInfo.data?.privacy_level_options &&
      creatorInfo.data.privacy_level_options.length > 0
    ) {
      const storedPrivacy = tiktokSettings.privacy;
      const availableOptions = creatorInfo.data.privacy_level_options;

      // Check if stored privacy is in available options
      if (!availableOptions.includes(storedPrivacy)) {
        // Stored privacy not available, update to first available option
        const newPrivacy = availableOptions[0] as TiktokPrivacyLevels;
        updateTikTokSettings({ privacy: newPrivacy });
      }
    }
  }, [
    tiktokSettings?.privacy,
    creatorInfo.data?.privacy_level_options,
    updateTikTokSettings,
  ]);

  // Validate paid partnership privacy conflict
  useEffect(() => {
    if (
      tiktokSettings &&
      (tiktokSettings.promotionContent === promotionContentTypes.PAID ||
        tiktokSettings.promotionContent === promotionContentTypes.BOTH) &&
      tiktokSettings.privacy === tikTokPrivacyLevels.SELF_ONLY
    ) {
      const defaultPrivacy =
        (creatorInfo.data?.privacy_level_options?.[0] as TiktokPrivacyLevels) ||
        tikTokPrivacyLevels.PUBLIC_TO_EVERYONE;
      updateTikTokSettings({ privacy: defaultPrivacy });
      // Notify user about the automatic correction
      toast.info(
        "Privacy changed to Public - Branded content cannot be set to private"
      );
    }
  }, [tiktokSettings, creatorInfo.data, updateTikTokSettings]);

  const handlePrivacyChange = (value: TiktokPrivacyLevels) => {
    updateTikTokSettings({ privacy: value });
  };

  // New handlers for toggle + switches UI
  const handleCommercialContentToggle = (checked: boolean) => {
    setCommercialToggleOn(checked);

    if (!checked) {
      // Turn off commercial content - set to NONE
      updateTikTokSettings({ promotionContent: promotionContentTypes.NONE });
    }
    // When turned on, leave both checkboxes unchecked (NONE state)
    // User must manually select at least one option
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

      // If enabling branded content and current privacy is "Only me", auto-switch to public
      if (
        checked &&
        tiktokSettings?.privacy === tikTokPrivacyLevels.SELF_ONLY
      ) {
        const defaultPrivacy =
          (creatorInfo.data
            ?.privacy_level_options?.[0] as TiktokPrivacyLevels) ||
          tikTokPrivacyLevels.PUBLIC_TO_EVERYONE;
        updateTikTokSettings({
          promotionContent: newPromotionContent,
          privacy: defaultPrivacy,
        });
        // Notify user about the privacy change
        toast.info(
          "Privacy changed to Public - Branded content cannot be set to private"
        );
      } else {
        updateTikTokSettings({ promotionContent: newPromotionContent });
      }
    }
  };

  // Show loading state while fetching creator info
  if (creatorInfo.isLoading && !creatorInfo.data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-2">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent border-solid motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
          <p className="text-muted-foreground text-sm">
            Loading TikTok settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold">TikTok Settings</h3>
        {creatorInfo.data && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
            {creatorInfo.data.creator_avatar_url && (
              <Image
                alt={creatorInfo.data.creator_nickname ?? "creator avatar"}
                className="h-8 w-8 rounded-full"
                height={32}
                src={creatorInfo.data.creator_avatar_url}
                width={32}
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
          onValueChange={handlePrivacyChange}
          value={
            tiktokSettings?.privacy ||
            creatorInfo.data?.privacy_level_options?.[0] ||
            tikTokPrivacyLevels.PUBLIC_TO_EVERYONE
          }
        >
          <SelectTrigger id="tiktok-privacy">
            <SelectValue placeholder="Select privacy level" />
          </SelectTrigger>
          <SelectContent>
            {/* Use API options if available, otherwise use defaults */}
            {(creatorInfo.data?.privacy_level_options &&
            creatorInfo.data.privacy_level_options.length > 0
              ? creatorInfo.data.privacy_level_options
              : [
                  tikTokPrivacyLevels.PUBLIC_TO_EVERYONE,
                  tikTokPrivacyLevels.MUTUAL_FOLLOW_FRIENDS,
                  tikTokPrivacyLevels.SELF_ONLY,
                ]
            ).map((option: string) => {
              const isSelfOnlyDisabled =
                option === tikTokPrivacyLevels.SELF_ONLY &&
                (tiktokSettings?.promotionContent ===
                  promotionContentTypes.PAID ||
                  tiktokSettings?.promotionContent ===
                    promotionContentTypes.BOTH);

              return (
                <SelectItem
                  className={cn(isSelfOnlyDisabled && "opacity-50")}
                  disabled={isSelfOnlyDisabled}
                  key={option}
                  value={option}
                >
                  <div className="flex w-full items-center justify-between">
                    <span>
                      {option === tikTokPrivacyLevels.PUBLIC_TO_EVERYONE &&
                        "Everyone"}
                      {option === tikTokPrivacyLevels.MUTUAL_FOLLOW_FRIENDS &&
                        "Friends"}
                      {option === tikTokPrivacyLevels.SELF_ONLY && "Only me"}
                      {option === "FOLLOWER_OF_CREATOR" && "Followers"}
                    </span>
                    {isSelfOnlyDisabled && (
                      <span className="ml-2 text-muted-foreground text-xs">
                        (Not available for branded content)
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Interaction Settings */}
      <div className="space-y-2">
        <Label>Interaction Settings</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              checked={!(tiktokSettings?.allowComments ?? true)}
              disabled={creatorInfo.data?.comment_disabled}
              id="disable-comments"
              onCheckedChange={(checked) =>
                updateTikTokSettings({ allowComments: !checked })
              }
            />
            <Label
              className="cursor-pointer font-normal text-sm"
              htmlFor="disable-comments"
            >
              Disable Comments
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={!(tiktokSettings?.allowDuet ?? true)}
              disabled={!hasVideo || creatorInfo.data?.duet_disabled}
              id="disable-duet"
              onCheckedChange={(checked) =>
                updateTikTokSettings({ allowDuet: !checked })
              }
            />
            <Label
              className={cn(
                "cursor-pointer font-normal text-sm",
                !hasVideo && "cursor-not-allowed opacity-50"
              )}
              htmlFor="disable-duet"
            >
              Disable Duet
              {!hasVideo && (
                <span className="ml-2 text-muted-foreground text-xs">
                  (Video only)
                </span>
              )}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={!(tiktokSettings?.allowStitch ?? true)}
              disabled={!hasVideo || creatorInfo.data?.stitch_disabled}
              id="disable-stitch"
              onCheckedChange={(checked) =>
                updateTikTokSettings({ allowStitch: !checked })
              }
            />
            <Label
              className={cn(
                "cursor-pointer font-normal text-sm",
                !hasVideo && "cursor-not-allowed opacity-50"
              )}
              htmlFor="disable-stitch"
            >
              Disable Stitch
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
            checked={commercialContentState.hasCommercialContent}
            id="commercial-content-toggle"
            onCheckedChange={handleCommercialContentToggle}
          />
          <Label
            className="cursor-pointer font-normal text-sm"
            htmlFor="commercial-content-toggle"
          >
            Content Disclosure Setting
          </Label>
        </div>

        {/* Label notification banner - shows when any option is selected */}
        {commercialContentState.hasCommercialContent &&
          (commercialContentState.yourBrand ||
            commercialContentState.brandedContent) && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <Icon
                className="text-blue-600 dark:text-blue-400"
                icon={InformationCircleIcon}
                size={16}
              />
              <AlertDescription className="text-blue-800 dark:text-blue-300">
                Your video will be labeled "
                {commercialContentState.brandedContent
                  ? "Paid partnership"
                  : "Promotional content"}
                ". This cannot be changed once your video is posted.
              </AlertDescription>
            </Alert>
          )}

        {/* Switches when toggle is enabled */}
        {commercialContentState.hasCommercialContent && (
          <div className="ml-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  className="cursor-pointer font-normal text-sm"
                  htmlFor="your-brand"
                >
                  Your brand
                </Label>
                <p className="text-muted-foreground text-xs">
                  You are promoting yourself or your own business
                </p>
              </div>
              <Switch
                checked={commercialContentState.yourBrand}
                id="your-brand"
                onCheckedChange={handleYourBrandChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  className="cursor-pointer font-normal text-sm"
                  htmlFor="branded-content"
                >
                  Branded content
                </Label>
                <p className="text-muted-foreground text-xs">
                  You are promoting another brand or a third party
                </p>
                {tiktokSettings?.privacy === tikTokPrivacyLevels.SELF_ONLY && (
                  <p className="mt-1 text-muted-foreground text-xs">
                    (Not available for private posts)
                  </p>
                )}
              </div>
              <Switch
                checked={commercialContentState.brandedContent}
                disabled={
                  tiktokSettings?.privacy === tikTokPrivacyLevels.SELF_ONLY
                }
                id="branded-content"
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

      {/* Consent Declaration - only show when commercial content is selected */}
      {tiktokSettings?.promotionContent &&
        tiktokSettings.promotionContent !== promotionContentTypes.NONE && (
          <TikTokConsentBanner
            promotionContent={tiktokSettings.promotionContent}
            variant="card"
          />
        )}
    </div>
  );
}
