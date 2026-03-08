"use client";

import { Icon } from "@delulu/design-system/providers/icon";
import {
  Comment01Icon,
  FavouriteIcon,
  RepeatIcon,
  Sent02Icon,
} from "@hugeicons-pro/core-solid-rounded";
import Image from "next/image";
import { PhoneFrame } from "./phone-frame";
import { formatNumber, usePreviewData } from "./preview-utils";

export function LinkedInPreview() {
  const { content, mediaUrl, hasVideo, hasImage, media, provider } =
    usePreviewData("LINKEDIN");

  if (!content) return null;

  return (
    <PhoneFrame>
      {/* LinkedIn Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 pt-10 pb-2">
        <span className="font-bold text-[#0A66C2] text-lg">in</span>
        <div className="h-7 flex-1 mx-3 rounded-sm bg-gray-100" />
        <div className="h-6 w-6 rounded-full bg-gray-200" />
      </div>

      {/* Post Card */}
      <div className="overflow-y-auto bg-gray-100" style={{ height: "calc(100% - 55px)" }}>
        <div className="mt-2 bg-white">
          {/* Post Header */}
          <div className="flex items-start gap-3 px-4 pt-3">
            {provider?.profileImage ? (
              <Image
                alt="Profile"
                className="h-12 w-12 shrink-0 rounded-full"
                height={48}
                src={provider.profileImage}
                width={48}
              />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200" />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm">
                {provider?.fullName || "Your Name"}
              </p>
              <p className="truncate text-gray-500 text-xs">
                {provider?.username || "Headline"} · 2h
              </p>
              <p className="text-gray-400 text-xs">🌐</p>
            </div>
          </div>

          {/* Post Text */}
          <div className="px-4 pt-2 pb-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {content.text || "Share your thoughts..."}
            </p>
          </div>

          {/* Media */}
          {(hasVideo || hasImage) && media?.url && (
            <div className="relative w-full" style={{ height: 250 }}>
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
                <Image alt="Preview" className="object-cover" fill src={mediaUrl} />
              )}
            </div>
          )}

          {/* Reaction Bar */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
            <div className="flex items-center gap-1">
              <span className="text-sm">👍❤️🎉</span>
              <span className="text-gray-500 text-xs">{formatNumber(847)}</span>
            </div>
            <span className="text-gray-500 text-xs">
              {formatNumber(23)} comments
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-around px-2 py-1">
            <button className="flex items-center gap-1 rounded px-3 py-2 text-gray-600 hover:bg-gray-100" type="button">
              <Icon icon={FavouriteIcon} size={18} />
              <span className="text-xs">Like</span>
            </button>
            <button className="flex items-center gap-1 rounded px-3 py-2 text-gray-600 hover:bg-gray-100" type="button">
              <Icon icon={Comment01Icon} size={18} />
              <span className="text-xs">Comment</span>
            </button>
            <button className="flex items-center gap-1 rounded px-3 py-2 text-gray-600 hover:bg-gray-100" type="button">
              <Icon icon={RepeatIcon} size={18} />
              <span className="text-xs">Repost</span>
            </button>
            <button className="flex items-center gap-1 rounded px-3 py-2 text-gray-600 hover:bg-gray-100" type="button">
              <Icon icon={Sent02Icon} size={18} />
              <span className="text-xs">Send</span>
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
