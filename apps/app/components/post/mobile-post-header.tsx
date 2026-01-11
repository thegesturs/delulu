'use client';

import { usePostActions } from '@/hooks/use-post-actions';
import { useIsMediaUploading } from '@/store/post';
import { Button } from '@delulu/design-system/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@delulu/design-system/components/ui/sheet';
import { Loader, Settings2 } from 'lucide-react';
import { FaBookmark } from 'react-icons/fa';
import { PiPaperPlaneTiltFill } from 'react-icons/pi';
import { PostSidebar } from './sidebar/post-sidebar';

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
          size="sm"
          variant="secondary"
          className="gap-2"
          onClick={handleSaveAsDraft}
          disabled={isProcessing || isMediaUploading}
        >
          {isProcessing ? (
            <Loader className="size-4 animate-spin" />
          ) : (
            <FaBookmark className="size-4" />
          )}
          <span className="sr-only">Save</span>
        </Button>

        <Button
          size="sm"
          className="gap-2"
          onClick={date ? handleSchedulePost : handlePostNow}
          disabled={isProcessing || isMediaUploading || isAtPostLimit}
        >
          {isProcessing ? (
            <Loader className="size-4 animate-spin" />
          ) : (
            <PiPaperPlaneTiltFill className="size-4" />
          )}
          <span className="sr-only">{date ? 'Schedule' : 'Post'}</span>
        </Button>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings2 className="size-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[90%] overflow-y-auto pt-10 sm:max-w-[500px]">
          <SheetHeader className="mb-4">
            <SheetTitle>Post Settings</SheetTitle>
          </SheetHeader>
          <PostSidebar />
        </SheetContent>
      </Sheet>
    </div>
  );
}
