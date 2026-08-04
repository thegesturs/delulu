"use client";

import {
  Alert,
  AlertDescription,
} from "@delulu/design-system/components/ui/alert";
import { Button } from "@delulu/design-system/components/ui/button";
import { CardContent } from "@delulu/design-system/components/ui/card";
import { NaturalDatePicker } from "@delulu/design-system/components/ui/natural-date-picker";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  AlertCircleIcon,
  Bookmark01Icon,
  Calendar03Icon,
  EyeIcon,
  Loading03Icon,
  Sent02Icon,
} from "@delulu/icons";
import { format } from "date-fns";
import { InlineUpgradePrompt } from "@/components/billing/upgrade-prompt";
import { usePermissions } from "@/hooks/use-permissions";
import { usePostActions } from "@/hooks/use-post-actions";
import {
  useDateTime,
  useIsMediaUploading,
  useSelectedSocialProviders,
  useStore,
} from "@/store/post";
import { TikTokConsentBanner } from "./tiktok-consent-banner";

interface BasicSettingsProps {
  onOpenPreview?: () => void;
}

export function BasicSettings({ onOpenPreview }: BasicSettingsProps = {}) {
  const { date } = useDateTime();
  const setDate = useStore((state) => state.setDateAlongWithTime);
  const selected = useSelectedSocialProviders();
  const isUploading = useIsMediaUploading();
  const { isViewer, canCreate } = usePermissions();
  const actions = usePostActions();
  const disabled =
    actions.isProcessing || isUploading || isViewer || !canCreate;
  const hasSchedule = Boolean(date);
  const primaryDisabled =
    disabled || selected.length === 0 || actions.isAtPostLimit;

  const handlePrimaryAction = () => {
    if (hasSchedule) {
      actions.handleSchedulePost();
      return;
    }
    actions.handlePostNow();
  };

  return (
    <CardContent className="space-y-4 p-4">
      <NaturalDatePicker onChange={setDate} value={date} />
      {actions.isAtPostLimit && (
        <Alert variant="destructive">
          <Icon icon={AlertCircleIcon} size={16} />
          <AlertDescription>
            Monthly post quota reached.{" "}
            <InlineUpgradePrompt feature="monthlyPosts" />
          </AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Button
          className="h-11 w-full"
          disabled={primaryDisabled}
          onClick={handlePrimaryAction}
        >
          {actions.isProcessing ? (
            <Icon className="animate-spin" icon={Loading03Icon} size={17} />
          ) : hasSchedule ? (
            <Icon icon={Calendar03Icon} size={17} />
          ) : (
            <Icon icon={Sent02Icon} size={17} />
          )}
          {hasSchedule && date
            ? `Schedule · ${format(date, "MMM d, h:mm a")}`
            : "Publish now"}
        </Button>
        <Button
          className="h-11 w-full"
          disabled={disabled}
          onClick={actions.handleSaveAsDraft}
          variant="ghost"
        >
          <Icon icon={Bookmark01Icon} size={17} />
          Save draft
        </Button>
        {onOpenPreview && (
          <Button
            className="h-11 w-full"
            onClick={onOpenPreview}
            variant="outline"
          >
            <Icon icon={EyeIcon} size={17} />
            Preview post
          </Button>
        )}
      </div>
      {selected.length === 0 && (
        <p className="text-center text-muted-foreground text-xs">
          Choose at least one account above the editor to publish or schedule.
        </p>
      )}
      <TikTokConsentBanner promotionContent="NONE" />
    </CardContent>
  );
}
