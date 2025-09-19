'use client';

import { useStore } from '@/store/post';
import { Badge } from '@delulu/design-system/components/ui/badge';
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
import { useEffect } from 'react';

interface TikTokSettingsProps {
  hasVideo: boolean;
  providerId: string;
}

export function TikTokSettingsDisplay({ hasVideo, providerId }: TikTokSettingsProps) {
  const { setProviderSettings, getProviderSettings } = useStore();
  const providerSetting = getProviderSettings(providerId);
  const tiktokSettings = providerSetting?.type === 'TIKTOK' ? providerSetting.settings : undefined;

  const updateTikTokSettings = (updates: Partial<TikTokSettings>) => {
    const currentSettings = tiktokSettings || {
      privacy: '' as TiktokPrivacyLevels, // No default - user must select
      allowComments: false, // Unchecked by default
      allowDuet: false, // Unchecked by default
      allowStitch: false, // Unchecked by default
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
  };

  // Effect for validation only - no initialization with defaults
  useEffect(() => {
    if (!tiktokSettings) return;

    // Validate and fix paid partnership privacy conflict
    if (
      tiktokSettings.promotionContent === promotionContentTypes.PAID &&
      tiktokSettings.privacy === tikTokPrivacyLevels.SELF_ONLY
    ) {
      updateTikTokSettings({ privacy: tikTokPrivacyLevels.PUBLIC_TO_EVERYONE });
    }
  }, [tiktokSettings?.promotionContent, tiktokSettings?.privacy]);

  const handlePrivacyChange = (value: TiktokPrivacyLevels) => {
    updateTikTokSettings({ privacy: value });
  };

  const handlePromotionChange = (value: PromotionContentType) => {
    updateTikTokSettings({ promotionContent: value });
  };

  const renderConsentText = () => {
    const hasPaidPromotion = tiktokSettings?.promotionContent === promotionContentTypes.PAID;

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
      <h3 className="font-semibold">TikTok Settings</h3>

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
            <SelectItem value={tikTokPrivacyLevels.PUBLIC_TO_EVERYONE}>
              Everyone
            </SelectItem>
            <SelectItem value={tikTokPrivacyLevels.MUTUAL_FOLLOW_FRIENDS}>
              Friends
            </SelectItem>
            <SelectItem
              value={tikTokPrivacyLevels.SELF_ONLY}
              disabled={
                tiktokSettings?.promotionContent === promotionContentTypes.PAID
              }
            >
              Only me
              {tiktokSettings?.promotionContent ===
                promotionContentTypes.PAID && (
                <span className="ml-2 text-muted-foreground text-xs">
                  (Not available for paid partnerships)
                </span>
              )}
            </SelectItem>
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
              disabled={!hasVideo}
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
              disabled={!hasVideo}
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
            Are you promoting a brand, product, or service?
          </p>
        </div>

        <Select
          value={tiktokSettings?.promotionContent || promotionContentTypes.NONE}
          onValueChange={handlePromotionChange}
        >
          <SelectTrigger className="h-auto min-h-fit py-2 text-left">
            <SelectValue
              placeholder="No promotion"
              className="min-h-fit py-2"
            />
          </SelectTrigger>
          <SelectContent className="w-[400px]">
            <SelectItem value={promotionContentTypes.NONE}>
              <div className="flex w-full items-center justify-between">
                <div>
                  <div className="font-medium">No Promotion</div>
                  <div className="text-muted-foreground text-xs">
                    Regular personal or entertainment content
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2 text-xs">
                  Default
                </Badge>
              </div>
            </SelectItem>
            <SelectItem value={promotionContentTypes.SELF}>
              <div className="flex w-full items-center justify-between">
                <div>
                  <div className="font-medium">My Business/Brand</div>
                  <div className="text-muted-foreground text-xs">
                    Promoting your own products or services
                  </div>
                </div>
                <Badge variant="outline" className="ml-2 text-xs">
                  Promotional
                </Badge>
              </div>
            </SelectItem>
            <SelectItem value={promotionContentTypes.PAID}>
              <div className="flex w-full items-start justify-between">
                <div className="flex-1 pr-2">
                  <div className="font-medium">Paid Partnership</div>
                  <div className="text-muted-foreground text-xs">
                    Sponsored by another brand
                  </div>
                  <div className="text-muted-foreground text-xs">
                    (shows "Paid partnership" label)
                  </div>
                </div>
                <Badge
                  variant="destructive"
                  className="ml-2 flex-shrink-0 text-xs"
                >
                  Sponsored
                </Badge>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {tiktokSettings?.promotionContent === promotionContentTypes.PAID && (
          <div className="rounded-md bg-muted p-3">
            <p className="text-muted-foreground text-xs">
              ⚠️ Your video will display a "Paid partnership" label to all
              viewers as required by TikTok's policies
            </p>
          </div>
        )}
      </div>

      {/* Consent Declaration */}
      <div className="rounded-md bg-muted/50 p-3">
        {renderConsentText()}
      </div>
    </div>
  );
}
