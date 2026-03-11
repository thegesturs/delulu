"use client";

import { Icon } from "@delulu/design-system/providers/icon";
import {
  Add01Icon,
  BookmarkIcon,
  FavouriteCircleIcon,
  HomeIcon,
  InboxIcon,
  MessageIcon,
  MusicNoteIcon,
  Search01Icon,
  ShareIcon,
  UserIcon,
} from "@hugeicons-pro/core-solid-rounded";
import Image from "next/image";
import { PhoneFrame } from "./phone-frame";
import { formatNumber, usePreviewData } from "./preview-utils";

export function TikTokPreview() {
  const { content, mediaUrl, hasVideo, hasImage, media, provider } =
    usePreviewData("TIKTOK");

  if (!content) {
    return null;
  }

  return (
    <PhoneFrame darkMode>
      {/* TikTok Header */}
      <div className="absolute top-10 z-20 flex h-12 w-full items-center justify-between px-4">
        <div className="h-6 w-6" />
        <div className="flex items-center gap-6 text-white">
          <span className="font-semibold text-white/60">Following</span>
          <span className="relative font-semibold">
            For You
            <span className="absolute -bottom-1 left-0 h-[2px] w-full bg-white" />
          </span>
        </div>
        <div className="h-6 w-6 rounded-full bg-white/10" />
      </div>

      {/* Video/Image Container */}
      <div className="relative h-full w-full bg-black">
        {(hasVideo || hasImage) && media?.url ? (
          <div className="relative h-full w-full">
            {hasVideo ? (
              <video
                autoPlay
                className="h-full w-full rounded-none object-cover"
                loop
                muted
                playsInline
                src={mediaUrl}
              />
            ) : (
              <Image
                alt="Preview"
                className="rounded-none object-cover"
                fill
                src={mediaUrl}
              />
            )}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-900">
            <div className="text-center text-white/60">
              <div className="mb-2 text-4xl">🎬</div>
              <p className="text-sm">No media</p>
            </div>
          </div>
        )}

        {/* Overlay Content */}
        <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 pb-20">
          <div className="mb-3 flex items-center gap-2">
            {provider?.profileImage ? (
              <Image
                alt="Profile"
                className="rounded-full ring-1 ring-white/20"
                height={32}
                src={provider.profileImage}
                width={32}
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-white/10" />
            )}
            <span className="font-semibold text-white">
              @{provider?.username || "username"}
            </span>
          </div>
          <div className="mb-3 text-white">
            <p className="line-clamp-3 text-[13px] leading-relaxed">
              {content.text || "Add your caption here..."}
            </p>
          </div>
          {hasVideo && (
            <div className="flex items-center gap-2 text-white/80">
              <Icon icon={MusicNoteIcon} size={16} />
              <span className="text-[11px]">Original Sound</span>
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-5">
          <div className="relative">
            {provider?.profileImage ? (
              <>
                <Image
                  alt="Profile"
                  className="rounded-full ring-2 ring-white"
                  height={48}
                  src={provider.profileImage}
                  width={48}
                />
                <div className="absolute -bottom-1 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-white/90 text-center text-black text-xs leading-5">
                  +
                </div>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-white/10 ring-2 ring-white" />
                <div className="absolute -bottom-1 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-white/90 text-center text-black text-xs leading-5">
                  +
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col items-center">
            <Icon className="text-white" icon={FavouriteCircleIcon} size={32} />
            <span className="text-white/80 text-xs">
              {formatNumber(12_300)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <Icon className="text-white" icon={MessageIcon} size={32} />
            <span className="text-white/80 text-xs">{formatNumber(234)}</span>
          </div>
          <div className="flex flex-col items-center">
            <Icon className="text-white" icon={BookmarkIcon} size={32} />
            <span className="text-white/80 text-xs">{formatNumber(1234)}</span>
          </div>
          <div className="flex flex-col items-center">
            <Icon className="text-white" icon={ShareIcon} size={32} />
            <span className="text-white/80 text-xs">{formatNumber(567)}</span>
          </div>
          {hasVideo && (
            <div className="mt-2 h-12 w-12 animate-spin rounded-full border border-white/20 bg-white/10" />
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute right-0 bottom-0 left-0 flex h-12 items-center justify-around bg-black/70 px-4">
          <div className="flex flex-col items-center text-white">
            <Icon icon={HomeIcon} size={20} />
            <span className="text-[11px]">Home</span>
          </div>
          <div className="flex flex-col items-center text-white/70">
            <Icon icon={Search01Icon} size={20} />
            <span className="text-[11px]">Discover</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white">
            <Icon className="-translate-y-[1px]" icon={Add01Icon} size={20} />
          </div>
          <div className="flex flex-col items-center text-white/70">
            <Icon icon={InboxIcon} size={20} />
            <span className="text-[11px]">Inbox</span>
          </div>
          <div className="flex flex-col items-center text-white/70">
            <Icon icon={UserIcon} size={20} />
            <span className="text-[11px]">Profile</span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
