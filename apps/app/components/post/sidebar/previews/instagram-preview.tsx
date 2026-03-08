"use client";

import { Icon } from "@delulu/design-system/providers/icon";
import {
  BookmarkIcon,
  Comment01Icon,
  FavouriteIcon,
  Home01Icon,
  Search01Icon,
  Sent02Icon,
  UserIcon,
} from "@hugeicons-pro/core-solid-rounded";
import { Add01Icon } from "@hugeicons-pro/core-solid-rounded";
import Image from "next/image";
import { PhoneFrame } from "./phone-frame";
import { formatNumber, usePreviewData } from "./preview-utils";

export function InstagramPreview() {
  const { content, mediaUrl, hasVideo, hasImage, media, provider } =
    usePreviewData("INSTAGRAM");

  if (!content) return null;

  return (
    <PhoneFrame>
      {/* Instagram Header */}
      <div className="flex h-11 items-center justify-between border-b border-gray-200 px-4 pt-10">
        <span className="font-semibold text-lg">Instagram</span>
        <div className="flex items-center gap-4">
          <Icon icon={FavouriteIcon} size={24} />
          <Icon icon={Sent02Icon} size={24} />
        </div>
      </div>

      {/* Post */}
      <div className="overflow-y-auto" style={{ height: "calc(100% - 90px)" }}>
        {/* Post Header */}
        <div className="flex items-center gap-3 px-3 py-2">
          {provider?.profileImage ? (
            <Image
              alt="Profile"
              className="rounded-full"
              height={32}
              src={provider.profileImage}
              width={32}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200" />
          )}
          <span className="font-semibold text-sm">
            {provider?.username || "username"}
          </span>
        </div>

        {/* Media */}
        <div className="relative aspect-square w-full bg-gray-100">
          {(hasVideo || hasImage) && media?.url ? (
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
              <Image alt="Preview" className="object-cover" fill src={mediaUrl} />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="mb-2 text-4xl">📷</div>
                <p className="text-sm">No media</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-4">
            <Icon icon={FavouriteIcon} size={24} />
            <Icon icon={Comment01Icon} size={24} />
            <Icon icon={Sent02Icon} size={24} />
          </div>
          <Icon icon={BookmarkIcon} size={24} />
        </div>

        {/* Likes */}
        <div className="px-3">
          <p className="font-semibold text-sm">{formatNumber(4_821)} likes</p>
        </div>

        {/* Caption */}
        <div className="px-3 pt-1 pb-2">
          <p className="text-sm">
            <span className="font-semibold">
              {provider?.username || "username"}
            </span>{" "}
            {content.text || "Add your caption here..."}
          </p>
          <p className="mt-1 text-gray-400 text-xs">2 hours ago</p>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="absolute right-0 bottom-0 left-0 flex h-12 items-center justify-around border-t border-gray-200 bg-white">
        <Icon icon={Home01Icon} size={24} />
        <Icon icon={Search01Icon} size={24} />
        <Icon icon={Add01Icon} size={24} />
        <Icon icon={FavouriteIcon} size={20} />
        <Icon icon={UserIcon} size={24} />
      </div>
    </PhoneFrame>
  );
}
