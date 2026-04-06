"use client";

import { Icon } from "@delulu/design-system/providers/icon";
import {
  BookmarkIcon,
  FavouriteIcon,
  ShareIcon,
  ThumbsDownIcon,
} from "@hugeicons-pro/core-solid-rounded";
import Image from "next/image";
import { PhoneFrame } from "./phone-frame";
import { formatNumber, usePreviewData } from "./preview-utils";

interface YouTubePreviewProps {
  postData?: Parameters<typeof usePreviewData>[1];
}

export function YouTubePreview({ postData }: YouTubePreviewProps = {}) {
  const { content, mediaUrl, hasVideo, hasImage, media, provider } =
    usePreviewData("YOUTUBE", postData);

  if (!content) {
    return null;
  }

  return (
    <PhoneFrame>
      {/* YouTube Header */}
      <div className="flex items-center justify-between border-neutral-200 border-b bg-white px-4 pt-10 pb-2 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center gap-1">
          <div className="flex h-6 w-8 items-center justify-center rounded bg-red-600">
            <div className="h-0 w-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-white" />
          </div>
          <span className="font-bold text-lg">YouTube</span>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ height: "calc(100% - 55px)" }}>
        {/* Video Player */}
        <div className="relative w-full bg-black" style={{ height: 200 }}>
          {(hasVideo || hasImage) && mediaUrl ? (
            hasVideo ? (
              <video
                autoPlay
                className="h-full w-full object-cover"
                loop
                muted
                playsInline
                src={mediaUrl}
              />
            ) : (
              <Image
                alt="Preview"
                className="object-cover"
                fill
                src={mediaUrl}
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center text-white/60">
                <div className="mb-2 text-4xl">🎥</div>
                <p className="text-sm">No media</p>
              </div>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="px-3 pt-3">
          <h3 className="font-semibold text-[15px] leading-tight">
            {content.text?.slice(0, 100) || "Video title goes here"}
          </h3>
          <p className="mt-1 text-neutral-500 text-xs">
            {formatNumber(12_456)} views · 2 hours ago
          </p>
        </div>

        {/* Channel Info */}
        <div className="mt-3 flex items-center gap-3 px-3">
          {provider?.profileImage ? (
            <Image
              alt="Channel"
              className="h-9 w-9 shrink-0 rounded-full"
              height={36}
              src={provider.profileImage}
              width={36}
            />
          ) : (
            <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">
              {provider?.fullName || provider?.username || "Channel Name"}
            </p>
            <p className="text-neutral-500 text-xs">
              {formatNumber(24_500)} subscribers
            </p>
          </div>
          <button
            className="rounded-full bg-black px-4 py-1.5 font-medium text-white text-xs dark:bg-white dark:text-black"
            type="button"
          >
            Subscribe
          </button>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto px-3 pb-3">
          <div className="flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <button
              className="flex items-center gap-1 rounded-l-full px-4 py-2"
              type="button"
            >
              <Icon icon={FavouriteIcon} size={18} />
              <span className="text-sm">{formatNumber(3421)}</span>
            </button>
            <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-600" />
            <button className="rounded-r-full px-3 py-2" type="button">
              <Icon icon={ThumbsDownIcon} size={18} />
            </button>
          </div>
          <button
            className="flex items-center gap-1 rounded-full bg-neutral-100 px-4 py-2 dark:bg-neutral-800"
            type="button"
          >
            <Icon icon={ShareIcon} size={18} />
            <span className="text-sm">Share</span>
          </button>
          <button
            className="flex items-center gap-1 rounded-full bg-neutral-100 px-4 py-2 dark:bg-neutral-800"
            type="button"
          >
            <Icon icon={BookmarkIcon} size={18} />
            <span className="text-sm">Save</span>
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
