"use client";

import { VisualPostPreviewCard } from "@delulu/design-system/components/social-preview/platform-post-card";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@delulu/design-system/components/ui/carousel";
import { cn } from "@delulu/design-system/lib/utils";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Add01Icon,
  BookmarkIcon,
  Comment01Icon,
  FavouriteIcon,
  Home01Icon,
  Search01Icon,
  Sent02Icon,
  UserIcon,
} from "@hugeicons-pro/core-solid-rounded";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useMediaUrl } from "@/hooks/use-media-url";
import { PhoneFrame } from "./phone-frame";
import { formatNumber, usePreviewData } from "./preview-utils";

interface InstagramPreviewProps {
  postData?: Parameters<typeof usePreviewData>[1];
}

/** Renders a single media item inside the carousel (needs its own component to call useMediaUrl hook) */
function CarouselMediaItem({
  item,
}: {
  item: { bucketKey?: string; url?: string; mediaType: string };
}) {
  const url = useMediaUrl(item.bucketKey, item.url);
  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-800" />
    );
  }
  return <Image alt="Preview" className="object-cover" fill src={url} />;
}

/** Instagram carousel with dot indicators */
function InstagramCarousel({
  items,
}: {
  items: Array<{
    bucketKey?: string;
    url?: string;
    mediaType: string;
  }>;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const onSelect = useCallback(() => {
    if (api) {
      setCurrent(api.selectedScrollSnap());
    }
  }, [api]);

  useEffect(() => {
    if (!api) {
      return;
    }
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <div className="relative w-full">
      <Carousel opts={{ loop: false }} setApi={setApi}>
        <CarouselContent className="ml-0">
          {items.map((item, index) => (
            <CarouselItem className="pl-0" key={index}>
              <div className="relative aspect-square w-full bg-neutral-100 dark:bg-neutral-800">
                <CarouselMediaItem item={item} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {items.map((_, index) => (
          <button
            aria-label={`Go to slide ${index + 1}`}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors",
              index === current ? "bg-blue-500" : "bg-white/50"
            )}
            key={index}
            onClick={() => api?.scrollTo(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

export function InstagramPreview({ postData }: InstagramPreviewProps = {}) {
  const { content, mediaUrl, hasVideo, hasImage, allMedia, provider } =
    usePreviewData("INSTAGRAM", postData);

  if (!content) {
    return null;
  }

  const isReel = hasVideo;

  if (isReel) {
    return (
      <PhoneFrame darkMode>
        {/* Reels - fullscreen vertical video like TikTok */}
        <div className="relative h-full w-full bg-black">
          {mediaUrl ? (
            <video
              autoPlay
              className="h-full w-full object-cover"
              loop
              muted
              playsInline
              src={mediaUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-900">
              <div className="text-center text-white/60">
                <div className="mb-2 text-4xl">🎬</div>
                <p className="text-sm">No media</p>
              </div>
            </div>
          )}

          {/* Reels Header */}
          <div className="absolute top-10 z-20 flex w-full items-center justify-between px-4">
            <span className="font-semibold text-white">Reels</span>
            <div className="h-6 w-6 rounded-full bg-white/10" />
          </div>

          {/* Bottom overlay */}
          <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 pb-16">
            <div className="mb-2 flex items-center gap-2">
              {provider?.profileImage ? (
                <Image
                  alt="Profile"
                  className="rounded-full ring-1 ring-white/20"
                  height={28}
                  src={provider.profileImage}
                  width={28}
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-white/20" />
              )}
              <span className="font-semibold text-sm text-white">
                {provider?.username || "username"}
              </span>
            </div>
            <p className="line-clamp-2 text-[13px] text-white leading-relaxed">
              {content.text || "Add your caption here..."}
            </p>
          </div>

          {/* Right side actions */}
          <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
            <div className="flex flex-col items-center">
              <Icon className="text-white" icon={FavouriteIcon} size={28} />
              <span className="text-white/80 text-xs">
                {formatNumber(4821)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Icon className="text-white" icon={Comment01Icon} size={28} />
              <span className="text-white/80 text-xs">{formatNumber(42)}</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon className="text-white" icon={Sent02Icon} size={28} />
            </div>
            <div className="flex flex-col items-center">
              <Icon className="text-white" icon={BookmarkIcon} size={28} />
            </div>
          </div>

          {/* Bottom Nav */}
          <div className="absolute right-0 bottom-0 left-0 flex h-12 items-center justify-around bg-black/70">
            <Icon className="text-white/70" icon={Home01Icon} size={24} />
            <Icon className="text-white/70" icon={Search01Icon} size={24} />
            <Icon className="text-white/70" icon={Add01Icon} size={24} />
            <Icon className="text-white" icon={FavouriteIcon} size={20} />
            <Icon className="text-white/70" icon={UserIcon} size={24} />
          </div>
        </div>
      </PhoneFrame>
    );
  }

  // Regular post (images / carousel)
  return (
    <PhoneFrame>
      {/* Instagram Header */}
      <div className="flex h-11 items-center justify-between border-neutral-200 border-b px-4 pt-10 dark:border-neutral-700">
        <span className="font-semibold text-lg dark:text-white">Instagram</span>
        <div className="flex items-center gap-4">
          <Icon className="dark:text-white" icon={FavouriteIcon} size={24} />
          <Icon className="dark:text-white" icon={Sent02Icon} size={24} />
        </div>
      </div>

      {/* Post */}
      <div className="overflow-y-auto" style={{ height: "calc(100% - 90px)" }}>
        <VisualPostPreviewCard
          avatarUrl={provider?.profileImage}
          className="rounded-none border-0 shadow-none"
          comments={42}
          dateLabel="2 hours ago"
          likes={4821}
          media={
            allMedia.length > 1 ? (
              <InstagramCarousel items={allMedia} />
            ) : (
              <div className="relative aspect-square w-full bg-neutral-100 dark:bg-neutral-800">
                {hasImage && mediaUrl ? (
                  <Image
                    alt="Preview"
                    className="object-cover"
                    fill
                    src={mediaUrl}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <p className="text-sm">No media</p>
                  </div>
                )}
              </div>
            )
          }
          text={content.text || "Add your caption here..."}
          username={provider?.username ?? undefined}
        />
      </div>

      {/* Bottom Nav */}
      <div className="absolute right-0 bottom-0 left-0 flex h-12 items-center justify-around border-neutral-200 border-t bg-white dark:border-neutral-700 dark:bg-black">
        <Icon className="dark:text-white" icon={Home01Icon} size={24} />
        <Icon className="dark:text-white" icon={Search01Icon} size={24} />
        <Icon className="dark:text-white" icon={Add01Icon} size={24} />
        <Icon className="dark:text-white" icon={FavouriteIcon} size={20} />
        <Icon className="dark:text-white" icon={UserIcon} size={24} />
      </div>
    </PhoneFrame>
  );
}
