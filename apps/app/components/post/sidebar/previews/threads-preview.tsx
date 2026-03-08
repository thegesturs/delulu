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

export function ThreadsPreview() {
  const { content, mediaUrl, hasVideo, hasImage, media, provider } =
    usePreviewData("THREADS");

  if (!content) return null;

  return (
    <PhoneFrame>
      {/* Threads Header */}
      <div className="flex items-center justify-center border-b border-gray-200 px-4 pt-10 pb-2">
        <span className="font-bold text-xl">@</span>
      </div>

      {/* Post */}
      <div className="overflow-y-auto px-4 pt-3" style={{ height: "calc(100% - 55px)" }}>
        <div className="flex gap-3">
          {/* Avatar + Thread Line */}
          <div className="flex flex-col items-center">
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
            <div className="mt-2 w-0.5 flex-1 bg-gray-200" />
          </div>

          <div className="min-w-0 flex-1 pb-4">
            {/* Name row */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {provider?.username || "username"}
              </span>
              <span className="text-gray-500 text-sm">2h</span>
            </div>

            {/* Post text */}
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">
              {content.text || "Start a thread..."}
            </p>

            {/* Media */}
            {(hasVideo || hasImage) && media?.url && (
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                {hasVideo ? (
                  <video
                    autoPlay
                    className="w-full object-cover"
                    loop
                    muted
                    playsInline
                    src={mediaUrl}
                    style={{ maxHeight: 280 }}
                  />
                ) : (
                  <div className="relative" style={{ height: 280 }}>
                    <Image
                      alt="Preview"
                      className="object-cover"
                      fill
                      src={mediaUrl}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Action Row */}
            <div className="mt-3 flex items-center gap-4 text-gray-500">
              <Icon icon={FavouriteIcon} size={20} />
              <Icon icon={Comment01Icon} size={20} />
              <Icon icon={RepeatIcon} size={20} />
              <Icon icon={Sent02Icon} size={20} />
            </div>

            {/* Counts */}
            <div className="mt-2 flex items-center gap-2 text-gray-400 text-xs">
              <span>{formatNumber(47)} replies</span>
              <span>·</span>
              <span>{formatNumber(892)} likes</span>
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
