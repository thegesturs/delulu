'use client';

import { usePost, useSelectedSocialProviders } from '@/store/post';
import { api } from '@delulu/database/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Bookmark, Heart, MessageCircle, Music, Share2 } from 'lucide-react';
import Image from 'next/image';

export function TikTokPreview() {
  const post = usePost();
  const selectedProviders = useSelectedSocialProviders();
  const connectedAccounts = useQuery(api.social_providers.getConnectedAccounts);

  // Find the selected TikTok provider ID
  const selectedTikTokProvider = selectedProviders.find(
    (provider) => provider.socialType === 'TIKTOK'
  );

  // Get the full TikTok provider data from connected accounts
  const tiktokProvider = connectedAccounts?.find(
    (account) => account._id === selectedTikTokProvider?.socialId
  );

  // Get the first content item for preview
  const content = post.content[0];
  if (!content) {
    return null;
  }

  // Get video or image from media
  const media = content.media?.[0];
  const hasVideo = media?.mediaType === 'VIDEO';
  const hasImage = media?.mediaType === 'IMAGE';

  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="flex items-center justify-center p-6">
      {/* Mobile Phone Container */}
      <div className="relative mx-auto w-[350px]">
        {/* Phone Frame */}
        <div className="relative rounded-[40px] border-8 border-border bg-border shadow-2xl">
          {/* Notch */}
          <div className="-translate-x-1/2 absolute top-0 left-1/2 z-10 h-6 w-32 rounded-b-2xl bg-border" />

          {/* Screen */}
          <div className="relative h-[600px] overflow-hidden rounded-[32px] bg-background">
            {/* Status Bar */}
            <div className="absolute top-0 z-20 flex h-12 w-full items-center justify-between px-6 text-foreground">
              <span className="text-sm">9:41</span>
              <div className="flex gap-1">
                <div className="h-3 w-6 rounded-sm bg-foreground" />
                <div className="h-3 w-6 rounded-sm bg-foreground" />
                <div className="h-3 w-6 rounded-sm bg-foreground" />
              </div>
            </div>

            {/* TikTok Header */}
            <div className="absolute top-12 z-20 flex h-12 w-full items-center justify-between px-4">
              <div className="h-6 w-6" />
              <div className="flex gap-4 text-foreground">
                <span className="font-semibold">Following</span>
                <span className="font-semibold text-muted-foreground">
                  For You
                </span>
              </div>
              <div className="h-6 w-6 rounded-full bg-muted" />
            </div>

            {/* Video/Image Container */}
            <div className="relative h-full w-full bg-muted">
              {(hasVideo || hasImage) && media?.url ? (
                <div className="relative h-full w-full">
                  {hasVideo ? (
                    <video
                      src={media.url}
                      className="h-full w-full object-cover"
                      loop
                      muted
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <Image
                      src={media.url}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-muted to-muted-foreground/20">
                  <div className="text-center text-muted-foreground">
                    <div className="mb-2 text-4xl">🎬</div>
                    <p className="text-sm">No media</p>
                  </div>
                </div>
              )}

              {/* Overlay Content */}
              <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-background/80 via-transparent to-transparent p-4 pb-16">
                {/* User Info */}
                <div className="mb-3 flex items-center gap-2">
                  {tiktokProvider?.profileImage ? (
                    <Image
                      src={tiktokProvider.profileImage}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted" />
                  )}
                  <span className="font-semibold text-foreground">
                    @{tiktokProvider?.username || 'username'}
                  </span>
                </div>

                {/* Caption */}
                <div className="mb-3 text-foreground">
                  <p className="line-clamp-3 text-sm">
                    {content.text || 'Add your caption here...'}
                  </p>
                </div>

                {/* Music */}
                {hasVideo && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Music className="h-4 w-4" />
                    <span className="text-xs">Original Sound</span>
                  </div>
                )}
              </div>

              {/* Right Side Actions */}
              <div className="absolute right-2 bottom-20 flex flex-col items-center gap-5">
                {/* Profile */}
                <div className="relative">
                  {tiktokProvider?.profileImage ? (
                    <>
                      <Image
                        src={tiktokProvider.profileImage}
                        alt="Profile"
                        width={48}
                        height={48}
                        className="rounded-full ring-2 ring-background"
                      />
                      <div className="-bottom-1 -translate-x-1/2 absolute left-1/2 h-5 w-5 rounded-full bg-destructive text-center text-destructive-foreground text-xs leading-5">
                        +
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded-full bg-muted ring-2 ring-background" />
                      <div className="-bottom-1 -translate-x-1/2 absolute left-1/2 h-5 w-5 rounded-full bg-destructive text-center text-destructive-foreground text-xs leading-5">
                        +
                      </div>
                    </>
                  )}
                </div>

                {/* Like */}
                <div className="flex flex-col items-center">
                  <Heart className="h-8 w-8 text-foreground" fill="none" />
                  <span className="text-foreground text-xs">
                    {formatNumber(12300)}
                  </span>
                </div>

                {/* Comment */}
                <div className="flex flex-col items-center">
                  <MessageCircle
                    className="h-8 w-8 text-foreground"
                    fill="none"
                  />
                  <span className="text-foreground text-xs">
                    {formatNumber(234)}
                  </span>
                </div>

                {/* Bookmark */}
                <div className="flex flex-col items-center">
                  <Bookmark className="h-8 w-8 text-foreground" fill="none" />
                  <span className="text-foreground text-xs">
                    {formatNumber(1234)}
                  </span>
                </div>

                {/* Share */}
                <div className="flex flex-col items-center">
                  <Share2 className="h-8 w-8 text-foreground" fill="none" />
                  <span className="text-foreground text-xs">
                    {formatNumber(567)}
                  </span>
                </div>

                {/* Music Disc */}
                {hasVideo && (
                  <div className="mt-2 h-12 w-12 animate-spin rounded-full bg-gradient-to-br from-muted to-muted-foreground" />
                )}
              </div>

              {/* Bottom Navigation */}
              <div className="absolute right-0 bottom-0 left-0 flex h-12 items-center justify-around bg-background/90 px-4">
                <div className="text-center">
                  <div className="h-5 w-5 bg-foreground/80" />
                  <span className="text-foreground/80 text-xs">Home</span>
                </div>
                <div className="text-center">
                  <div className="h-5 w-5 bg-foreground/40" />
                  <span className="text-foreground/40 text-xs">Discover</span>
                </div>
                <div className="relative h-8 w-12 rounded-lg bg-background">
                  <div className="absolute left-0 h-full w-8 rounded-lg bg-cyan-400" />
                  <div className="absolute right-0 h-full w-8 rounded-lg bg-red-500" />
                  <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-5 w-5 text-foreground">
                    +
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-5 w-5 bg-foreground/40" />
                  <span className="text-foreground/40 text-xs">Inbox</span>
                </div>
                <div className="text-center">
                  <div className="h-5 w-5 bg-foreground/40" />
                  <span className="text-foreground/40 text-xs">Profile</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Buttons */}
        <div className="-right-3 absolute top-32 h-8 w-1 rounded-r-lg bg-border" />
        <div className="-right-3 absolute top-48 h-16 w-1 rounded-r-lg bg-border" />
        <div className="-left-3 absolute top-48 h-16 w-1 rounded-l-lg bg-border" />
      </div>
    </div>
  );
}
