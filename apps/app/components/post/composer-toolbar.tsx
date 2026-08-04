"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@delulu/design-system/components/ui/sheet";
import { SidebarTrigger } from "@delulu/design-system/components/ui/sidebar";
import { Icon } from "@delulu/design-system/providers/icon";
import { Calendar03Icon, Loading03Icon, Settings01Icon } from "@delulu/icons";
import { format } from "date-fns";
import { useState } from "react";
import { FaBookmark } from "react-icons/fa";
import { PiPaperPlaneTiltFill } from "react-icons/pi";
import { usePermissions } from "@/hooks/use-permissions";
import { usePostActions } from "@/hooks/use-post-actions";
import { useIsMediaUploading, useSelectedSocialProviders } from "@/store/post";
import { PostSidebar } from "./sidebar/post-sidebar";

interface ComposerToolbarProps {
  postId?: string;
  organizationId?: string;
  actionsDisabled?: boolean;
}

export function ComposerToolbar({
  postId,
  organizationId,
  actionsDisabled = false,
}: ComposerToolbarProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const actions = usePostActions();
  const selected = useSelectedSocialProviders();
  const isUploading = useIsMediaUploading();
  const { isViewer, canCreate } = usePermissions();
  const disabled =
    actionsDisabled ||
    actions.isProcessing ||
    isUploading ||
    isViewer ||
    !canCreate;
  const cannotPublish =
    disabled || selected.length === 0 || actions.isAtPostLimit;

  return (
    <Sheet onOpenChange={setIsPanelOpen} open={isPanelOpen}>
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-border/60 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger
            aria-label="Open navigation"
            className="-ml-1 size-11 shrink-0 text-muted-foreground"
          />
          <div className="min-w-0">
            <h1 className="truncate font-medium text-sm sm:text-base">
              {postId ? "Edit post" : "New post"}
            </h1>
            <p className="hidden truncate text-muted-foreground text-xs sm:block">
              {isUploading
                ? "Uploading media…"
                : "Write once, publish anywhere"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            aria-label="Save draft"
            className="size-11 px-0 sm:h-9 sm:w-auto sm:px-3"
            disabled={disabled}
            onClick={actions.handleSaveAsDraft}
            variant="ghost"
          >
            {actions.isProcessing ? (
              <Icon className="animate-spin" icon={Loading03Icon} size={16} />
            ) : (
              <FaBookmark className="size-3.5" />
            )}
            <span className="hidden sm:inline">Save draft</span>
          </Button>

          <Button
            aria-label={actions.date ? "Schedule post" : "Choose schedule"}
            className="size-11 px-0 sm:h-9 sm:w-auto sm:px-3"
            disabled={cannotPublish}
            onClick={() => {
              if (actions.date) {
                actions.handleSchedulePost();
                return;
              }
              setIsPanelOpen(true);
            }}
            title={
              actions.date
                ? `Schedule for ${format(actions.date, "MMM d, h:mm a")}`
                : "Choose a date and time"
            }
            variant="outline"
          >
            <Icon icon={Calendar03Icon} size={16} />
            <span className="hidden md:inline">
              {actions.date
                ? format(actions.date, "MMM d, h:mm a")
                : "Schedule"}
            </span>
          </Button>

          <Button
            className="h-11 px-3 sm:h-9 sm:px-4"
            disabled={cannotPublish}
            onClick={actions.handlePostNow}
          >
            {actions.isProcessing ? (
              <Icon className="animate-spin" icon={Loading03Icon} size={16} />
            ) : (
              <PiPaperPlaneTiltFill className="size-4" />
            )}
            <span className="hidden sm:inline">Publish</span>
          </Button>

          <SheetTrigger asChild>
            <Button
              aria-label="Open post settings and preview"
              className="size-11 sm:size-9"
              size="icon"
              variant="ghost"
            >
              <Icon icon={Settings01Icon} size={18} />
            </Button>
          </SheetTrigger>
        </div>
      </header>

      <SheetContent className="w-[min(92vw,460px)] gap-0 p-0 sm:max-w-[460px]">
        <SheetHeader className="border-border/60 border-b pr-12">
          <SheetTitle>Post controls</SheetTitle>
          <SheetDescription>
            Choose accounts, set a time, and preview before publishing.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1">
          <PostSidebar organizationId={organizationId} postId={postId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
