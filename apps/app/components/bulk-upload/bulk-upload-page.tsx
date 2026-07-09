"use client";

import { BULK_UPLOAD_SCHEDULED } from "@delulu/analytics/events";
import { useAnalytics } from "@delulu/analytics/posthog/client";
import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import {
  Alert,
  AlertDescription,
} from "@delulu/design-system/components/ui/alert";
import { Button } from "@delulu/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@delulu/design-system/components/ui/card";
import { Icon } from "@delulu/design-system/providers/icon";
import { AlertCircleIcon, Loading03Icon } from "@hugeicons-pro/core-solid-rounded";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer } from "react";
import { PiPaperPlaneTiltFill } from "react-icons/pi";
import { toast } from "sonner";
import { InlineUpgradePrompt } from "@/components/billing/upgrade-prompt";
import { Header } from "@/components/layout/header";
import { useMediaStorage } from "@/hooks/use-media-storage";
import { usePermissions } from "@/hooks/use-permissions";
import { useUsageLimit } from "@/hooks/use-usage-limits";
import {
  PLATFORM_VIDEO_RULES,
  validateVideo,
} from "@/lib/platform-rules";
import { BulkDropzone } from "./bulk-dropzone";
import type { BulkVideo, SelectedProvider } from "./bulk-upload-reducer";
import {
  bulkUploadReducer,
  computeScheduledAt,
  initialState,
} from "./bulk-upload-reducer";
import { BulkSocialSelector } from "./bulk-social-selector";
import { BulkVideoList } from "./bulk-video-list";
import { ScheduleConfig } from "./schedule-config";

export function BulkUploadPage() {
  const [state, dispatch] = useReducer(bulkUploadReducer, initialState);
  const { uploadAndSaveMedia } = useMediaStorage();
  const upsertPost = useMutation(api.posts.upsertPost);
  const router = useRouter();
  const analytics = useAnalytics();
  const { requiresApproval, isViewer } = usePermissions();

  const user = useQuery(api.users.current);
  const monthlyPostsCount = user?.usage?.monthlyPosts || 0;
  const monthlyPostsLimit = useUsageLimit("monthlyPosts", monthlyPostsCount);
  const postsRemaining = monthlyPostsLimit.isUnlimited
    ? Infinity
    : Math.max(0, (monthlyPostsLimit.limit ?? 0) - monthlyPostsCount);

  const isSubmitting = state.submissionStatus === "submitting";
  const allUploaded = state.videos.every((v) => v.uploadStatus === "uploaded");
  const hasVideos = state.videos.length > 0;
  const hasProviders = state.selectedProviders.length > 0;
  const hasSchedule = state.startDate !== null;
  const hasValidationErrors = state.videos.some(
    (v) => v.validationErrors.length > 0
  );
  const exceedsLimit = !monthlyPostsLimit.isUnlimited && state.videos.length > postsRemaining;

  const canSubmit =
    hasVideos &&
    hasProviders &&
    hasSchedule &&
    allUploaded &&
    !hasValidationErrors &&
    !exceedsLimit &&
    !isSubmitting &&
    !isViewer;

  // Warn before closing with in-progress work
  useEffect(() => {
    if (!hasVideos) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasVideos]);

  // Validate videos when platforms change
  useEffect(() => {
    const validateAll = async () => {
      for (const video of state.videos) {
        const errors: string[] = [];
        for (const provider of state.selectedProviders) {
          const rules =
            PLATFORM_VIDEO_RULES[
              provider.socialType as keyof typeof PLATFORM_VIDEO_RULES
            ];
          if (rules) {
            const result = await validateVideo(video.file, rules);
            if (!result.isValid) {
              errors.push(
                ...result.errors.map((e) => `${provider.socialType}: ${e}`)
              );
            }
          }
        }
        dispatch({ type: "SET_VALIDATION_ERRORS", id: video.id, errors });
      }
    };
    if (state.selectedProviders.length > 0 && state.videos.length > 0) {
      validateAll();
    }
  }, [state.selectedProviders, state.videos.length]);

  const handleFilesSelected = useCallback(
    async (newVideos: BulkVideo[]) => {
      dispatch({ type: "ADD_VIDEOS", videos: newVideos });

      // Upload all in parallel
      for (const video of newVideos) {
        dispatch({
          type: "SET_UPLOAD_STATUS",
          id: video.id,
          status: "uploading",
        });

        uploadAndSaveMedia(video.file)
          .then((result) => {
            dispatch({
              type: "SET_UPLOAD_STATUS",
              id: video.id,
              status: "uploaded",
              result: { bucketKey: result.bucketKey, url: result.url },
            });
          })
          .catch(() => {
            dispatch({
              type: "SET_UPLOAD_STATUS",
              id: video.id,
              status: "failed",
            });
            toast.error(`Failed to upload ${video.file.name}`);
          });
      }
    },
    [uploadAndSaveMedia]
  );

  const handleToggleProvider = useCallback((provider: SelectedProvider) => {
    dispatch({ type: "TOGGLE_PROVIDER", provider });
  }, []);

  const handleScheduleAll = useCallback(async () => {
    if (!canSubmit || !state.startDate) return;

    dispatch({ type: "SET_SUBMISSION_STATUS", status: "submitting" });

    let successCount = 0;
    let failCount = 0;

    for (const [index, video] of state.videos.entries()) {
      if (!video.uploadResult) continue;

      dispatch({ type: "SET_POST_STATUS", id: video.id, status: "creating" });

      const scheduledAt = computeScheduledAt(
        index,
        state.startDate,
        state.intervalMinutes
      );

      try {
        await upsertPost({
          content: [
            {
              order: 0,
              name: "DEFAULT",
              text: video.caption,
              media: [
                {
                  mediaType: "VIDEO" as const,
                  bucketKey: video.uploadResult.bucketKey,
                  url: video.uploadResult.url,
                },
              ],
              tags: [],
            },
          ],
          alternativeContent: [],
          socialProviderIds: state.selectedProviders.map(
            (p) => p.socialId as Id<"socialProviders">
          ),
          providerSettings: [],
          scheduledAt,
          status: "SCHEDULED",
        });

        dispatch({ type: "SET_POST_STATUS", id: video.id, status: "created" });
        successCount++;
      } catch {
        dispatch({ type: "SET_POST_STATUS", id: video.id, status: "failed" });
        failCount++;
      }
    }

    analytics.capture(BULK_UPLOAD_SCHEDULED, {
      total_videos: state.videos.length,
      success_count: successCount,
      fail_count: failCount,
      platforms: state.selectedProviders.map((p) => p.socialType),
      interval_minutes: state.intervalMinutes,
    });

    if (failCount === 0) {
      dispatch({ type: "SET_SUBMISSION_STATUS", status: "done" });
      toast.success(`${successCount} posts scheduled successfully`);
      router.push("/posts?status=SCHEDULED");
    } else {
      dispatch({ type: "SET_SUBMISSION_STATUS", status: "partial-failure" });
      toast.error(
        `${successCount} scheduled, ${failCount} failed. You can retry the failed ones.`
      );
    }
  }, [canSubmit, state, upsertPost, analytics, router]);

  return (
    <div className="flex h-full flex-col gap-4 pb-20 lg:flex-row lg:pb-0">
      <div className="flex-1 space-y-4">
        <Header page="Bulk Upload" pages={["Posts"]} />

        <BulkDropzone
          disabled={isSubmitting}
          onFilesSelected={handleFilesSelected}
        />

        <BulkVideoList
          disabled={isSubmitting}
          intervalMinutes={state.intervalMinutes}
          onCaptionChange={(id, caption) =>
            dispatch({ type: "SET_CAPTION", id, caption })
          }
          onMove={(id, direction) =>
            dispatch({ type: "MOVE_VIDEO", id, direction })
          }
          onRemove={(id) => dispatch({ type: "REMOVE_VIDEO", id })}
          startDate={state.startDate}
          videos={state.videos}
        />
      </div>

      <div className="w-full lg:w-80">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-sm">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <BulkSocialSelector
              onToggle={handleToggleProvider}
              selectedProviders={state.selectedProviders}
            />

            <ScheduleConfig
              intervalMinutes={state.intervalMinutes}
              onIntervalChange={(minutes) =>
                dispatch({ type: "SET_INTERVAL", minutes })
              }
              onStartDateChange={(date) =>
                dispatch({ type: "SET_START_DATE", date: date ?? null })
              }
              startDate={state.startDate}
              videoCount={state.videos.length}
            />

            {exceedsLimit && (
              <InlineUpgradePrompt feature="monthlyPosts" requiredPlan="VIBE" />
            )}

            {!monthlyPostsLimit.isUnlimited &&
              !exceedsLimit &&
              hasVideos &&
              monthlyPostsLimit.percentageUsed >= 60 && (
                <Alert>
                  <Icon icon={AlertCircleIcon} size={16} />
                  <AlertDescription className="text-xs">
                    {postsRemaining} posts remaining this month. Scheduling{" "}
                    {state.videos.length}.
                  </AlertDescription>
                </Alert>
              )}

            {isViewer && (
              <Alert>
                <AlertDescription className="text-xs">
                  Viewers cannot create posts.
                </AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full justify-center gap-2"
              disabled={!canSubmit}
              onClick={handleScheduleAll}
            >
              {requiresApproval
                ? `Submit ${state.videos.length} for Approval`
                : `Schedule ${state.videos.length} Posts`}
              {isSubmitting ? (
                <Icon className="animate-spin" icon={Loading03Icon} size={16} />
              ) : (
                <PiPaperPlaneTiltFill className="size-4" />
              )}
            </Button>

            {!hasVideos && (
              <p className="text-center text-muted-foreground text-xs">
                Drop videos above to get started
              </p>
            )}
            {hasVideos && !hasProviders && (
              <p className="text-center text-muted-foreground text-xs">
                Select at least one social network
              </p>
            )}
            {hasVideos && hasProviders && !hasSchedule && (
              <p className="text-center text-muted-foreground text-xs">
                Pick a start date and time
              </p>
            )}
            {hasVideos && !allUploaded && (
              <p className="text-center text-muted-foreground text-xs">
                Waiting for uploads to complete...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
