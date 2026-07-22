"use client";

import {
  Alert,
  AlertDescription,
} from "@delulu/design-system/components/ui/alert";
import { Button } from "@delulu/design-system/components/ui/button";
import { CardContent } from "@delulu/design-system/components/ui/card";
import { DottedSeparator } from "@delulu/design-system/components/ui/dotted-separator";
import { NaturalDatePicker } from "@delulu/design-system/components/ui/natural-date-picker";
import { Icon } from "@delulu/design-system/providers/icon";
import { AlertCircleIcon, Loading03Icon } from "@delulu/icons";
import { FaBookmark } from "react-icons/fa";
import { PiPaperPlaneTiltFill } from "react-icons/pi";
import { InlineUpgradePrompt } from "@/components/billing/upgrade-prompt";
import { usePermissions } from "@/hooks/use-permissions";
import { usePostActions } from "@/hooks/use-post-actions";
import {
  useDateTime,
  useIsMediaUploading,
  useSelectedSocialProviders,
  useStore,
} from "@/store/post";
import SocialSelector from "./social-selector";
import { TikTokConsentBanner } from "./tiktok-consent-banner";

export function BasicSettings() {
  const { date } = useDateTime();
  const setDate = useStore((state) => state.setDateAlongWithTime);
  const selected = useSelectedSocialProviders();
  const isUploading = useIsMediaUploading();
  const { isViewer, canCreate } = usePermissions();
  const actions = usePostActions();
  const disabled =
    actions.isProcessing || isUploading || isViewer || !canCreate;

  return (
    <CardContent className="space-y-5 p-4">
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
      <div className="grid grid-cols-2 gap-2">
        <Button
          disabled={disabled || selected.length === 0}
          onClick={actions.handlePostNow}
        >
          {actions.isProcessing ? (
            <Icon className="mr-2" icon={Loading03Icon} size={16} />
          ) : (
            <PiPaperPlaneTiltFill className="mr-2 size-4" />
          )}
          Publish now
        </Button>
        <Button
          className="surface-raised"
          disabled={disabled || !date || selected.length === 0}
          onClick={actions.handleSchedulePost}
          variant="outline"
        >
          Schedule
        </Button>
        <Button
          className="col-span-2"
          disabled={disabled}
          onClick={actions.handleSaveAsDraft}
          variant="ghost"
        >
          <FaBookmark className="mr-2" /> Save draft
        </Button>
      </div>
      {selected.length === 0 && (
        <p className="text-center text-muted-foreground text-xs">
          Select at least one account below to publish or schedule.
        </p>
      )}
      <DottedSeparator />
      <SocialSelector />
      <TikTokConsentBanner promotionContent="NONE" />
    </CardContent>
  );
}
