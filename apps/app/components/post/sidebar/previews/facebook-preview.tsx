"use client";

import { Icon } from "@delulu/design-system/providers/icon";
import {
  Comment01Icon,
  FavouriteIcon,
  ShareIcon,
} from "@hugeicons-pro/core-solid-rounded";
import Image from "next/image";
import { PhoneFrame } from "./phone-frame";
import { formatNumber, usePreviewData } from "./preview-utils";

export function FacebookPreview() {
  const { content, mediaUrl, hasVideo, hasImage, media, provider } =
    usePreviewData("FACEBOOK");

  if (!content) {
    return null;
  }

  return (
    <PhoneFrame>
      {/* Facebook Header */}
      <div className="flex items-center justify-between border-gray-200 border-b bg-white px-4 pt-10 pb-2">
        <span className="font-bold text-[#1877F2] text-xl">facebook</span>
      </div>

      {/* Post */}
      <div
        className="overflow-y-auto bg-gray-100"
        style={{ height: "calc(100% - 55px)" }}
      >
        <div className="mt-2 bg-white">
          {/* Post Header */}
          <div className="flex items-center gap-3 px-4 pt-3">
            {provider?.profileImage ? (
              <Image
                alt="Profile"
                className="h-10 w-10 shrink-0 rounded-full"
                height={40}
                src={provider.profileImage}
                width={40}
              />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {provider?.fullName || provider?.username || "Your Name"}
              </p>
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <span>2h</span>
                <span>·</span>
                <span>🌐</span>
              </div>
            </div>
          </div>

          {/* Post Text */}
          <div className="px-4 pt-2 pb-3">
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {content.text || "What's on your mind?"}
            </p>
          </div>

          {/* Media */}
          {(hasVideo || hasImage) && media?.url && (
            <div className="relative w-full" style={{ height: 280 }}>
              {hasVideo ? (
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
              )}
            </div>
          )}

          {/* Reactions + Counts */}
          <div className="flex items-center justify-between border-gray-200 border-b px-4 py-2">
            <div className="flex items-center gap-1">
              <span className="text-sm">👍❤️😂</span>
              <span className="text-gray-500 text-sm">
                {formatNumber(2341)}
              </span>
            </div>
            <div className="flex gap-3 text-gray-500 text-sm">
              <span>{formatNumber(89)} comments</span>
              <span>{formatNumber(34)} shares</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-around px-2 py-1">
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded py-2 text-gray-600 hover:bg-gray-100"
              type="button"
            >
              <Icon icon={FavouriteIcon} size={20} />
              <span className="text-sm">Like</span>
            </button>
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded py-2 text-gray-600 hover:bg-gray-100"
              type="button"
            >
              <Icon icon={Comment01Icon} size={20} />
              <span className="text-sm">Comment</span>
            </button>
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded py-2 text-gray-600 hover:bg-gray-100"
              type="button"
            >
              <Icon icon={ShareIcon} size={20} />
              <span className="text-sm">Share</span>
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
