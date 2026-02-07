"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@delulu/design-system/components/ui/sheet";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Loading03Icon,
  Settings01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { FaBookmark } from "react-icons/fa";
import { PiPaperPlaneTiltFill } from "react-icons/pi";
import { usePostActions } from "@/hooks/use-post-actions";
import { useIsMediaUploading } from "@/store/post";
import { PostSidebar } from "./sidebar/post-sidebar";

export function MobilePostHeader() {
  const {
    handlePostNow,
    handleSchedulePost,
    handleSaveAsDraft,
    isProcessing,
    isAtPostLimit,
    date,
    postId,
  } = usePostActions();
  const isMediaUploading = useIsMediaUploading();

  return (
    <div className="flex items-center justify-between gap-2 border-b p-4 lg:hidden">
      <div className="flex items-center gap-2">
        <Button
          className="gap-2"
          disabled={isProcessing || isMediaUploading}
          onClick={handleSaveAsDraft}
          size="sm"
          variant="secondary"
        >
          {isProcessing ? (
            <Icon className="animate-spin" icon={Loading03Icon} size={16} />
          ) : (
            <FaBookmark className="size-4" />
          )}
          <span className="sr-only">Save</span>
        </Button>

        <Button
          className="gap-2"
          disabled={isProcessing || isMediaUploading || isAtPostLimit}
          onClick={date ? handleSchedulePost : handlePostNow}
          size="sm"
        >
          {isProcessing ? (
            <Icon className="animate-spin" icon={Loading03Icon} size={16} />
          ) : (
            <PiPaperPlaneTiltFill className="size-4" />
          )}
          <span className="sr-only">{date ? "Schedule" : "Post"}</span>
        </Button>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost">
            <Icon icon={Settings01Icon} size={20} />
            <span className="sr-only">Settings</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          className="w-[90%] overflow-y-auto pt-10 sm:max-w-[500px]"
          side="right"
        >
          <SheetHeader className="mb-4">
            <SheetTitle>Post Settings</SheetTitle>
          </SheetHeader>
          <PostSidebar />
        </SheetContent>
      </Sheet>
    </div>
  );
}
