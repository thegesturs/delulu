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
import { Icon } from "@delulu/design-system/providers/icon";
import { DEFAULT_INSTAGRAM_SETTINGS } from "@delulu/validators/constants/settings";
import type { InstagramSettings } from "@delulu/validators/post";
import { InformationCircleIcon } from "@hugeicons-pro/core-solid-rounded";
import { useCallback } from "react";
import { useStore } from "@/store/post";

interface InstagramSettingsProps {
  hasVideo: boolean;
  providerId: string;
}

export function InstagramSettingsDisplay({
  hasVideo,
  providerId,
}: InstagramSettingsProps) {
  const { setProviderSettings, getProviderSettings } = useStore();
  const providerSetting = getProviderSettings(providerId);
  const instagramSettings =
    providerSetting?.type === "INSTAGRAM"
      ? providerSetting.settings
      : undefined;

  const settings = instagramSettings ?? DEFAULT_INSTAGRAM_SETTINGS;

  const updateSettings = useCallback(
    (updates: Partial<InstagramSettings>) => {
      const newSettings = { ...settings, ...updates };
      setProviderSettings(providerId, {
        socialProviderId: providerId,
        type: "INSTAGRAM",
        settings: newSettings,
      });
    },
    [providerId, setProviderSettings, settings]
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Instagram Settings</h3>

      {/* Trial Reels */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="trial-reels">Trial Reel</Label>
            <p className="text-muted-foreground text-xs">
              Post as a trial reel — only visible to non-followers initially
            </p>
          </div>
          <Switch
            checked={settings.trialReels}
            disabled={!hasVideo}
            id="trial-reels"
            onCheckedChange={(checked) =>
              updateSettings({ trialReels: checked })
            }
          />
        </div>

        {!hasVideo && (
          <p className="text-muted-foreground text-xs italic">
            Trial reels are only available for video content.
          </p>
        )}

        {settings.trialReels && hasVideo && (
          <div className="space-y-2">
            <Label>Graduation Strategy</Label>
            <Select
              onValueChange={(value) =>
                updateSettings({
                  graduationStrategy: value as "MANUAL" | "SS_PERFORMANCE",
                })
              }
              value={settings.graduationStrategy}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="SS_PERFORMANCE">
                  Auto (Performance-based)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {settings.graduationStrategy === "MANUAL"
                ? "You decide when to share the reel to your feed."
                : "Instagram will automatically share the reel to your feed if it performs well."}
            </p>

            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <Icon
                className="text-blue-600 dark:text-blue-400"
                icon={InformationCircleIcon}
                size={16}
              />
              <AlertDescription className="text-blue-800 dark:text-blue-300">
                Trial reels are shown to a small audience of non-followers
                first. Based on performance (or your manual choice), they can
                later be shared to your full audience.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
