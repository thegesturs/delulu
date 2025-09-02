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
  type TiktokPrivacyLevels,
  tikTokPrivacyLevels,
} from '@delulu/validators/post';
import { AlertCircle, Info } from 'lucide-react';
import { useEffect } from 'react';

interface TikTokSettingsProps {
  hasVideo: boolean;
}

export function TikTokSettings({ hasVideo }: TikTokSettingsProps) {
  const { tiktokSettings, setTikTokSettings } = useStore();

  // Initialize with defaults if not set
  useEffect(() => {
    if (!tiktokSettings) {
      setTikTokSettings({
        privacy: tikTokPrivacyLevels.PUBLIC_TO_EVERYONE,
        allowComments: true,
        allowDuet: hasVideo,
        allowStitch: hasVideo,
        commercialContent: false,
        yourBrand: false,
        brandedContent: false,
      });
    }
  }, [tiktokSettings, hasVideo, setTikTokSettings]);

  // Reset privacy if branded content conflicts
  useEffect(() => {
    if (
      tiktokSettings?.brandedContent &&
      tiktokSettings?.privacy === tikTokPrivacyLevels.SELF_ONLY
    ) {
      setTikTokSettings({ privacy: tikTokPrivacyLevels.PUBLIC_TO_EVERYONE });
    }
  }, [
    tiktokSettings?.brandedContent,
    tiktokSettings?.privacy,
    setTikTokSettings,
  ]);

  const handlePrivacyChange = (value: TiktokPrivacyLevels) => {
    setTikTokSettings({ privacy: value });
  };

  const handleCommercialToggle = (checked: boolean) => {
    setTikTokSettings({
      commercialContent: checked,
      ...(checked === false && {
        yourBrand: false,
        brandedContent: false,
      }),
    });
  };

  const consentText = tiktokSettings?.brandedContent
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
              disabled={tiktokSettings?.brandedContent}
            >
              Only me
              {tiktokSettings?.brandedContent && (
                <span className="ml-2 text-muted-foreground text-xs">
                  (Not available for branded content)
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
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="commercial-content" className="font-normal text-sm">
              Commercial Content
            </Label>
            <p className="mt-1 text-muted-foreground text-xs">
              Does this content promote a brand, product or service?
            </p>
          </div>
          <Switch
            id="commercial-content"
            checked={tiktokSettings?.commercialContent || false}
            onCheckedChange={handleCommercialToggle}
          />
        </div>

        {tiktokSettings?.commercialContent && (
          <div className="ml-4 space-y-3 border-muted border-l-2 pl-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="your-brand"
                checked={tiktokSettings?.yourBrand || false}
                onCheckedChange={(checked) =>
                  setTikTokSettings({ yourBrand: !!checked })
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor="your-brand"
                  className="cursor-pointer font-normal text-sm"
                >
                  Your Brand
                </Label>
                <p className="text-muted-foreground text-xs">
                  Content promoting your own business or products
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Promotional
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="branded-content"
                checked={tiktokSettings?.brandedContent || false}
                onCheckedChange={(checked) =>
                  setTikTokSettings({ brandedContent: !!checked })
                }
              />
              <div className="flex-1">
                <Label
                  htmlFor="branded-content"
                  className="cursor-pointer font-normal text-sm"
                >
                  Branded Content
                </Label>
                <p className="text-muted-foreground text-xs">
                  Paid partnership or sponsored content from another brand
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Paid partnership
              </Badge>
            </div>

            {tiktokSettings?.commercialContent &&
              !tiktokSettings?.yourBrand &&
              !tiktokSettings?.brandedContent && (
                <p className="flex items-center gap-1 text-xs text-yellow-600">
                  <AlertCircle className="h-3 w-3" />
                  Please select at least one option above
                </p>
              )}

            {tiktokSettings?.yourBrand && tiktokSettings?.brandedContent && (
              <p className="flex items-center gap-1 text-blue-600 text-xs">
                <Info className="h-3 w-3" />
                Your video will be labeled as "Paid partnership"
              </p>
            )}
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
