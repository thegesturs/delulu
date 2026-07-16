import { UserRound } from "lucide-react";
import Image from "next/image";
import { formatPreviewCount, type PreviewState } from "../utils/preview-state";

function Avatar({ state }: { state: PreviewState }) {
  if (!state.avatarUrl) {
    return (
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UserRound aria-hidden className="size-5" />
      </span>
    );
  }
  return (
    <Image
      alt={`${state.displayName || state.username || "Profile"} avatar`}
      className="size-11 rounded-full object-cover"
      height={44}
      src={state.avatarUrl}
      unoptimized={state.avatarUrl.startsWith("blob:")}
      width={44}
    />
  );
}

export function InstagramProfilePreviewCard({
  state,
}: {
  state: PreviewState;
}) {
  return (
    <article
      aria-label="Instagram profile preview"
      className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border bg-background shadow-sm"
    >
      <header className="border-b p-5">
        <p className="mb-5 text-center font-semibold">
          {state.username || "your_username"}
        </p>
        <div className="flex items-center gap-5 sm:gap-8">
          <div className="rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600 p-0.5">
            <div className="rounded-full border-2 border-background">
              <Avatar state={state} />
            </div>
          </div>
          <dl className="grid flex-1 grid-cols-3 gap-3 text-center">
            {[
              [state.posts, "posts"],
              [state.followers, "followers"],
              [state.following, "following"],
            ].map(([value, label]) => (
              <div key={label as string}>
                <dt className="font-semibold">
                  {formatPreviewCount(value as number)}
                </dt>
                <dd className="text-muted-foreground text-xs sm:text-sm">
                  {label as string}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-4 font-semibold text-sm">
          {state.displayName || "Your name"}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-5">
          {state.text || "Your profile bio will appear here."}
        </p>
      </header>
      <div className="grid grid-cols-3 gap-0.5 bg-muted">
        {Array.from({ length: 9 }, (_, index) => {
          const mediaUrl = state.mediaUrls[index];
          return (
            <div className="relative aspect-square bg-background" key={index}>
              {mediaUrl ? (
                <Image
                  alt={`${state.altText || "Profile grid image"} ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 33vw, 180px"
                  src={mediaUrl}
                  unoptimized={mediaUrl.startsWith("blob:")}
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
