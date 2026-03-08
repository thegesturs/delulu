"use client";

import { Icon } from "@delulu/design-system/providers/icon";
import {
  Comment01Icon,
  FavouriteIcon,
  RepeatIcon,
  ShareIcon,
} from "@hugeicons-pro/core-solid-rounded";
import Image from "next/image";
import { PhoneFrame } from "./phone-frame";
import { formatNumber, usePreviewData } from "./preview-utils";

export function TwitterPreview() {
  const { content, mediaUrl, hasVideo, hasImage, media, provider } =
    usePreviewData("TWITTER");

  if (!content) return null;

  return (
    <PhoneFrame>
      {/* Header */}
      <div className="flex items-center justify-center border-b border-gray-200 px-4 pt-10 pb-2">
        <span className="font-bold text-lg">𝕏</span>
      </div>

      {/* Tweet */}
      <div className="overflow-y-auto px-4 pt-3" style={{ height: "calc(100% - 55px)" }}>
        <div className="flex gap-3">
          {/* Avatar */}
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

          <div className="min-w-0 flex-1">
            {/* Name row */}
            <div className="flex items-center gap-1">
              <span className="truncate font-bold text-sm">
                {provider?.fullName || "Display Name"}
              </span>
              <span className="truncate text-gray-500 text-sm">
                @{provider?.username || "username"}
              </span>
              <span className="text-gray-500 text-sm">·</span>
              <span className="text-gray-500 text-sm">2h</span>
            </div>

            {/* Tweet text */}
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">
              {content.text || "What's happening?"}
            </p>

            {/* Media */}
            {(hasVideo || hasImage) && media?.url && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200">
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
            <div className="mt-3 flex items-center justify-between pb-3 text-gray-500">
              <div className="flex items-center gap-1">
                <Icon icon={Comment01Icon} size={18} />
                <span className="text-xs">{formatNumber(42)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon icon={RepeatIcon} size={18} />
                <span className="text-xs">{formatNumber(156)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon icon={FavouriteIcon} size={18} />
                <span className="text-xs">{formatNumber(1_203)}</span>
              </div>
              <Icon icon={ShareIcon} size={18} />
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
