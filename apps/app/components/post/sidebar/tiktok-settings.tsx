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
  type TiktokPrivacyLevels,
  promotionContentTypes,
  tikTokPrivacyLevels,
} from '@delulu/validators/post';
import { useEffect } from 'react';

interface TikTokSettingsProps {
  hasVideo: boolean;
}

export function TikTokSettings({ hasVideo }: TikTokSettingsProps) {
  const { tiktokSettings, setTikTokSettings } = useStore();

  // Combined effect for initialization and validation
  useEffect(() => {
    // Initialize with defaults if not set
    if (!tiktokSettings) {
      setTikTokSettings({
        privacy: tikTokPrivacyLevels.PUBLIC_TO_EVERYONE,
        allowComments: true,
        allowDuet: hasVideo,
        allowStitch: hasVideo,
        promotionContent: promotionContentTypes.NONE,
      });
      return; // Exit early after initialization
    }

    // Validate and fix paid partnership privacy conflict
    if (
      tiktokSettings.promotionContent === promotionContentTypes.PAID &&
      tiktokSettings.privacy === tikTokPrivacyLevels.SELF_ONLY
    ) {
      setTikTokSettings({ privacy: tikTokPrivacyLevels.PUBLIC_TO_EVERYONE });
    }
  }, [
    tiktokSettings,
    hasVideo,
    // Only depend on the entire object, not individual properties to avoid loops
  ]);

  const handlePrivacyChange = (value: TiktokPrivacyLevels) => {
    setTikTokSettings({ privacy: value });
  };

  const handlePromotionChange = (value: PromotionContentType) => {
    setTikTokSettings({ promotionContent: value });
  };

  const consentText =
    tiktokSettings?.promotionContent === promotionContentTypes.PAID
      ? "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation"
      : "By posting, you agree to TikTok's Music Usage Confirmation";

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">TikTok Settings</h3>

      {/* Privacy Level */}
      <div className="flex justify-between space-y-2">
        <Label htmlFor="tiktok-privacy">Privacy Level</Label>
        <Select
          value={
            tiktokSettings?.privacy || tikTokPrivacyLevels.PUBLIC_TO_EVERYONE
          }
          onValueChange={handlePrivacyChange}
        >
          <SelectTrigger id="tiktok-privacy">
            <SelectValue placeholder="Everyone (default)" />
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
              checked={tiktokSettings?.allowComments ?? true}
              onCheckedChange={(checked) =>
                setTikTokSettings({ allowComments: !!checked })
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
              checked={tiktokSettings?.allowDuet ?? hasVideo}
              disabled={!hasVideo}
              onCheckedChange={(checked) =>
                setTikTokSettings({ allowDuet: !!checked })
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
              checked={tiktokSettings?.allowStitch ?? hasVideo}
              disabled={!hasVideo}
              onCheckedChange={(checked) =>
                setTikTokSettings({ allowStitch: !!checked })
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
        <p className="text-muted-foreground text-xs">{consentText}</p>
      </div>
    </div>
  );
}
