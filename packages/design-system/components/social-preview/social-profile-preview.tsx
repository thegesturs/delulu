import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import { cn } from "@delulu/design-system/lib/utils";
import { UserRound } from "lucide-react";

export interface SocialProfilePreviewProps {
  avatarUrl?: string;
  displayName?: string;
  username?: string;
  bio: string;
  posts: number;
  followers: number;
  following: number;
  mediaUrls: string[];
  mediaAltText?: string;
  className?: string;
}

const compact = (value: number) =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(
    Math.max(0, value || 0)
  );

export function InstagramProfilePreview({
  avatarUrl,
  displayName,
  username,
  bio,
  posts,
  followers,
  following,
  mediaUrls,
  mediaAltText,
  className,
}: SocialProfilePreviewProps) {
  return (
    <article
      aria-label="Instagram profile preview"
      className={cn(
        "mx-auto w-full max-w-lg overflow-hidden rounded-2xl border bg-background shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-center gap-2 border-b px-4 py-3">
        <SocialIcon size="sm" type="INSTAGRAM" />
        <p className="min-w-0 truncate font-semibold">
          {username || "your_username"}
        </p>
      </div>
      <header className="border-b p-4 sm:p-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          <div className="shrink-0 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600 p-0.5">
            <div className="rounded-full border-2 border-background">
              {avatarUrl ? (
                <img
                  alt={`${displayName || username || "Profile"} avatar`}
                  className="size-14 rounded-full object-cover"
                  src={avatarUrl}
                />
              ) : (
                <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <UserRound aria-hidden className="size-6" />
                </span>
              )}
            </div>
          </div>
          <dl className="grid w-full min-w-0 flex-1 grid-cols-3 gap-2 text-center">
            {[
              [posts, "posts"],
              [followers, "followers"],
              [following, "following"],
            ].map(([value, label]) => (
              <div className="min-w-0" key={label as string}>
                <dt className="font-semibold">{compact(value as number)}</dt>
                <dd className="truncate text-muted-foreground text-xs sm:text-sm">
                  {label as string}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-4 font-semibold text-sm">
          {displayName || "Your name"}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-5">
          {bio || "Your profile bio will appear here."}
        </p>
      </header>
      <div className="grid grid-cols-3 gap-0.5 bg-muted">
        {Array.from({ length: 9 }, (_, index) => {
          const mediaUrl = mediaUrls[index];
          return (
            <div className="relative aspect-square bg-background" key={index}>
              {mediaUrl ? (
                <img
                  alt={`${mediaAltText || "Profile grid image"} ${index + 1}`}
                  className="absolute inset-0 size-full object-cover"
                  src={mediaUrl}
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                  {index + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}
