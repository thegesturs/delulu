import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import {
  type SupportedSocialPlatform,
  socialDisplayNames,
} from "@delulu/design-system/lib/social-config";
import { cn } from "@delulu/design-system/lib/utils";
import {
  Bookmark,
  CirclePlus,
  Heart,
  Home,
  Inbox,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Repeat2,
  Search,
  Send,
  Share2,
  ThumbsUp,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { PlatformPostHeader } from "./platform-post-header";

export interface SocialPostPreviewProps {
  platform: SupportedSocialPlatform;
  avatarUrl?: string;
  displayName?: string;
  username?: string;
  headline?: string;
  text: string;
  media?: ReactNode;
  dateLabel: string;
  likes: number;
  comments: number;
  shares?: number;
  className?: string;
}

const compact = (value: number) =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(
    Math.max(0, value || 0)
  );

function ProfileAvatar({
  avatarUrl,
  label,
  size = "md",
}: {
  avatarUrl?: string;
  label: string;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "size-9" : "size-11";
  return avatarUrl ? (
    <img
      alt={`${label} avatar`}
      className={cn("shrink-0 rounded-full object-cover", sizeClass)}
      src={avatarUrl}
    />
  ) : (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
        sizeClass
      )}
    >
      <UserRound aria-hidden className="size-5" />
    </span>
  );
}

function Identity({
  platform,
  avatarUrl,
  displayName,
  username,
  detail,
  meta,
}: Pick<
  SocialPostPreviewProps,
  "platform" | "avatarUrl" | "displayName" | "username"
> & { detail?: string; meta?: string }) {
  return (
    <PlatformPostHeader
      avatarUrl={avatarUrl}
      detail={detail}
      displayName={displayName}
      meta={meta}
      platform={platform}
      username={username}
    />
  );
}

function InstagramPost(props: SocialPostPreviewProps) {
  return (
    <>
      <Identity {...props} meta={props.dateLabel} />
      {props.media}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <Heart aria-hidden className="size-6" />
          <MessageCircle aria-hidden className="size-6" />
          <Send aria-hidden className="size-6" />
          <Bookmark aria-hidden className="ml-auto size-6" />
        </div>
        <p className="mt-3 font-semibold text-sm">
          {compact(props.likes)} likes
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
          <span className="mr-2 font-semibold">
            {props.username || "your_username"}
          </span>
          {props.text || "Your caption will appear here."}
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          View all {compact(props.comments)} comments
        </p>
      </div>
    </>
  );
}

function LinkedInPost(props: SocialPostPreviewProps) {
  return (
    <>
      <Identity
        {...props}
        detail={props.headline || "Your professional headline"}
        meta={`${props.dateLabel} · Public`}
      />
      <p className="whitespace-pre-wrap px-4 pb-4 text-[15px] leading-6">
        {props.text || "Your professional update will appear here."}
      </p>
      {props.media}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 text-muted-foreground text-sm">
        <span className="shrink-0">👍 ♥ {compact(props.likes)}</span>
        <span className="min-w-0 truncate text-right">
          {compact(props.comments)} comments · {compact(props.shares ?? 0)}
          {" reposts"}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1 p-2 text-muted-foreground text-sm">
        {[
          [ThumbsUp, "Like"],
          [MessageCircle, "Comment"],
          [Repeat2, "Repost"],
          [Send, "Send"],
        ].map(([ActionIcon, label]) => (
          <span
            className="flex min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-2"
            key={label as string}
          >
            <ActionIcon aria-hidden className="size-4 shrink-0" />
            <span className="hidden truncate sm:inline">{label as string}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function FacebookPost(props: SocialPostPreviewProps) {
  return (
    <>
      <Identity {...props} meta={`${props.dateLabel} · Public`} />
      <p className="whitespace-pre-wrap px-4 pb-4 text-[15px] leading-6">
        {props.text || "What is on your mind?"}
      </p>
      {props.media}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 text-muted-foreground text-sm">
        <span>👍 ❤️ {compact(props.likes)}</span>
        <span className="truncate text-right">
          {compact(props.comments)} comments · {compact(props.shares ?? 0)}{" "}
          shares
        </span>
      </div>
      <div className="grid grid-cols-3 p-2 text-muted-foreground text-sm">
        {[
          [ThumbsUp, "Like"],
          [MessageCircle, "Comment"],
          [Share2, "Share"],
        ].map(([ActionIcon, label]) => (
          <span
            className="flex items-center justify-center gap-2 rounded-lg py-2"
            key={label as string}
          >
            <ActionIcon aria-hidden className="size-4" />
            <span>{label as string}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function TwitterPost(props: SocialPostPreviewProps) {
  return (
    <div className="flex gap-3 p-4">
      <ProfileAvatar
        avatarUrl={props.avatarUrl}
        label={props.displayName || props.username || "Profile"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1 text-sm">
          <span className="truncate font-semibold">
            {props.displayName || "Your name"}
          </span>
          <span className="truncate text-muted-foreground">
            @{props.username || "username"} · {props.dateLabel}
          </span>
          <MoreHorizontal aria-hidden className="ml-auto size-4 shrink-0" />
        </div>
        <p className="mt-1 whitespace-pre-wrap text-[15px] leading-6">
          {props.text || "What is happening?"}
        </p>
        {props.media && <div className="mt-3">{props.media}</div>}
        <div className="mt-3 grid grid-cols-4 text-muted-foreground text-sm">
          <span className="flex items-center gap-1">
            <MessageCircle aria-hidden className="size-4" />
            {compact(props.comments)}
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 aria-hidden className="size-4" />
            {compact(props.shares ?? 0)}
          </span>
          <span className="flex items-center gap-1">
            <Heart aria-hidden className="size-4" />
            {compact(props.likes)}
          </span>
          <Share2 aria-hidden className="size-4" />
        </div>
      </div>
    </div>
  );
}

function ThreadsPost(props: SocialPostPreviewProps) {
  return (
    <div className="flex gap-3 p-4">
      <ProfileAvatar
        avatarUrl={props.avatarUrl}
        label={props.displayName || props.username || "Profile"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="truncate font-semibold">
            {props.username || "username"}
          </span>
          <span className="text-muted-foreground">{props.dateLabel}</span>
          <MoreHorizontal aria-hidden className="ml-auto size-4" />
        </div>
        <p className="mt-1 whitespace-pre-wrap text-[15px] leading-6">
          {props.text || "Start a thread."}
        </p>
        {props.media && <div className="mt-3">{props.media}</div>}
        <div className="mt-3 flex items-center gap-5 text-muted-foreground">
          <Heart aria-hidden className="size-5" />
          <MessageCircle aria-hidden className="size-5" />
          <Repeat2 aria-hidden className="size-5" />
          <Send aria-hidden className="size-5" />
        </div>
        <p className="mt-2 text-muted-foreground text-xs">
          {compact(props.comments)} replies · {compact(props.likes)} likes
        </p>
      </div>
    </div>
  );
}

function ShortVideoPost(props: SocialPostPreviewProps) {
  return (
    <div className="relative aspect-[9/16] min-h-[34rem] overflow-hidden bg-black text-white">
      <div className="absolute inset-0">{props.media}</div>
      {!props.media && (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black" />
      )}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/55 to-transparent px-4 pt-5 pb-12">
        <span className="size-6" />
        <div className="flex items-center gap-5 text-sm">
          <span className="text-white/65">Following</span>
          <span className="relative font-semibold">
            For You
            <span className="absolute -bottom-2 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-white" />
          </span>
        </div>
        <Search aria-hidden className="size-5" />
      </div>

      <div className="absolute right-3 bottom-28 z-10 flex flex-col items-center gap-4 text-xs drop-shadow-md">
        <span className="relative mb-1">
          {props.avatarUrl ? (
            <img
              alt={`${props.displayName || props.username || "Creator"} avatar`}
              className="size-11 rounded-full border-2 border-white object-cover"
              src={props.avatarUrl}
            />
          ) : (
            <span className="flex size-11 items-center justify-center rounded-full border-2 border-white bg-zinc-700">
              <UserRound aria-hidden className="size-5" />
            </span>
          )}
          <CirclePlus
            aria-hidden
            className="absolute -bottom-2 left-1/2 size-5 -translate-x-1/2 fill-rose-500 text-white"
          />
        </span>
        <span className="flex flex-col items-center gap-1 font-medium">
          <Heart aria-hidden className="size-8 fill-white" />
          {compact(props.likes)}
        </span>
        <span className="flex flex-col items-center gap-1 font-medium">
          <MessageCircle aria-hidden className="size-8 fill-white" />
          {compact(props.comments)}
        </span>
        <span className="flex flex-col items-center gap-1 font-medium">
          <Bookmark aria-hidden className="size-8 fill-white" />
          {compact(Math.round(props.likes / 4))}
        </span>
        <span className="flex flex-col items-center gap-1 font-medium">
          <Share2 aria-hidden className="size-8 fill-white" />
          {compact(props.shares ?? 0)}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-14 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pt-28 pr-16 pb-4">
        <p className="font-semibold">@{props.username || "username"}</p>
        <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-5">
          {props.text || "Your short-form caption will appear here."}
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs">
          <Music2 aria-hidden className="size-4" /> Original sound ·
          {props.displayName || props.username || "Creator"}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 grid h-14 grid-cols-5 items-center bg-black px-3 text-[10px]">
        <span className="flex flex-col items-center gap-1">
          <Home aria-hidden className="size-5 fill-white" /> Home
        </span>
        <span className="flex flex-col items-center gap-1 text-white/70">
          <Search aria-hidden className="size-5" /> Discover
        </span>
        <span className="mx-auto flex h-7 w-11 items-center justify-center rounded-lg bg-white text-black shadow-[-3px_0_0_#25f4ee,3px_0_0_#fe2c55]">
          +
        </span>
        <span className="flex flex-col items-center gap-1 text-white/70">
          <Inbox aria-hidden className="size-5" /> Inbox
        </span>
        <span className="flex flex-col items-center gap-1 text-white/70">
          <UserRound aria-hidden className="size-5" /> Profile
        </span>
      </div>
    </div>
  );
}

function YouTubePost(props: SocialPostPreviewProps) {
  return (
    <>
      <div className="aspect-video bg-black">{props.media}</div>
      <div className="p-4">
        <h3 className="font-semibold leading-6">
          {props.text.split("\n")[0] || "Your video title"}
        </h3>
        <p className="mt-1 text-muted-foreground text-sm">
          {compact(props.likes * 8)} views · {props.dateLabel}
        </p>
        <div className="mt-4 flex items-center gap-3 border-t pt-4">
          <ProfileAvatar
            avatarUrl={props.avatarUrl}
            label={props.displayName || props.username || "Channel"}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-sm">
              {props.displayName || "Channel name"}
            </p>
            <p className="text-muted-foreground text-xs">
              {compact(props.likes * 3)} subscribers
            </p>
          </div>
          <span className="rounded-full bg-foreground px-4 py-2 font-medium text-background text-sm">
            Subscribe
          </span>
        </div>
        <div className="mt-4 flex gap-2 text-sm">
          <span className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <ThumbsUp aria-hidden className="size-4" /> {compact(props.likes)}
          </span>
          <span className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
            <Share2 aria-hidden className="size-4" /> Share
          </span>
        </div>
      </div>
    </>
  );
}

export function SocialPostPreview(props: SocialPostPreviewProps) {
  const content = (() => {
    switch (props.platform) {
      case "INSTAGRAM":
        return <InstagramPost {...props} />;
      case "LINKEDIN":
        return <LinkedInPost {...props} />;
      case "FACEBOOK":
        return <FacebookPost {...props} />;
      case "TWITTER":
        return <TwitterPost {...props} />;
      case "THREADS":
        return <ThreadsPost {...props} />;
      case "TIKTOK":
        return <ShortVideoPost {...props} />;
      case "YOUTUBE":
        return <YouTubePost {...props} />;
      default:
        return <InstagramPost {...props} />;
    }
  })();

  return (
    <article
      aria-label={`${props.platform.toLowerCase()} post preview`}
      className={cn(
        "mx-auto w-full max-w-[36rem] overflow-hidden rounded-2xl border bg-background shadow-sm",
        props.platform === "TIKTOK" && "max-w-[24rem] border-black bg-black",
        props.className
      )}
    >
      {props.platform !== "TIKTOK" && (
        <div className="flex items-center gap-2 border-b px-4 py-2.5 text-muted-foreground text-xs">
          <SocialIcon size="sm" type={props.platform} />
          <span className="font-medium">
            {socialDisplayNames[props.platform]}
          </span>
        </div>
      )}
      {content}
    </article>
  );
}
