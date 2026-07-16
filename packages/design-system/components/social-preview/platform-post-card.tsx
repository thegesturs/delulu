import { cn } from "@delulu/design-system/lib/utils";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  ThumbsUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { PlatformPostHeader } from "./platform-post-header";

const compact = (value: number) =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(
    Math.max(0, value || 0)
  );

interface SharedPostCardProps {
  avatarUrl?: string;
  displayName?: string;
  username?: string;
  text: string;
  media?: ReactNode;
  likes: number;
  comments: number;
  shares?: number;
  className?: string;
}

export function VisualPostPreviewCard({
  avatarUrl,
  displayName,
  username,
  text,
  media,
  likes,
  comments,
  shares,
  className,
  dateLabel,
}: SharedPostCardProps & { dateLabel: string }) {
  return (
    <article
      aria-label="Visual social post preview"
      className={cn(
        "overflow-hidden rounded-2xl border bg-background shadow-sm",
        className
      )}
    >
      <div className="relative">
        <PlatformPostHeader
          avatarUrl={avatarUrl}
          detail={displayName}
          meta={dateLabel}
          username={username}
          variant="visual"
        />
        <span
          aria-hidden
          className="absolute top-6 right-4 text-muted-foreground tracking-[0.2em]"
        >
          •••
        </span>
      </div>
      {media}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <Heart aria-hidden className="size-6" />
          <MessageCircle aria-hidden className="size-6" />
          <Send aria-hidden className="size-6" />
          <Bookmark aria-hidden className="ml-auto size-6" />
        </div>
        <p className="mt-3 font-semibold text-sm">{compact(likes)} likes</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
          <span className="mr-2 font-semibold">
            {username || "your_username"}
          </span>
          {text || "Your caption will appear here."}
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          View all {compact(comments)} comments
          {shares === undefined ? "" : ` · ${compact(shares)} shares`}
        </p>
      </div>
    </article>
  );
}

export function ProfessionalPostPreviewCard({
  avatarUrl,
  displayName,
  username,
  text,
  media,
  likes,
  comments,
  shares = 0,
  className,
  headline,
  dateLabel,
}: SharedPostCardProps & { headline: string; dateLabel: string }) {
  return (
    <article
      aria-label="Professional social post preview"
      className={cn(
        "overflow-hidden rounded-xl border bg-background shadow-sm",
        className
      )}
    >
      <PlatformPostHeader
        avatarUrl={avatarUrl}
        detail={headline || "Your professional headline"}
        displayName={displayName}
        meta={`${username ? `@${username} · ` : ""}${dateLabel} · Public`}
        variant="professional"
      />
      <p className="whitespace-pre-wrap px-4 pb-4 text-[15px] leading-6">
        {text || "Your professional update will appear here."}
      </p>
      {media}
      <div className="flex items-center justify-between border-b px-4 py-3 text-muted-foreground text-sm">
        <span>👍 ♥ {compact(likes)}</span>
        <span>
          {compact(comments)} comments · {compact(shares)} reposts
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
            className="flex items-center justify-center gap-1 rounded-lg px-1 py-2"
            key={label as string}
          >
            <ActionIcon aria-hidden className="size-4" />
            <span className="hidden sm:inline">{label as string}</span>
          </span>
        ))}
      </div>
    </article>
  );
}
