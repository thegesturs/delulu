import { VisualPostPreviewCard } from "@delulu/design-system/components/social-preview/platform-post-card";
import { ImagePlus } from "lucide-react";
import Image from "next/image";
import { formatPreviewDate, type PreviewState } from "../utils/preview-state";

export function InstagramPostPreviewCard({ state }: { state: PreviewState }) {
  const mediaUrl = state.mediaUrls[0];
  const media = mediaUrl ? (
    <div className="relative aspect-square overflow-hidden bg-muted">
      <Image
        alt={state.altText || "Post preview media"}
        className="object-cover"
        fill
        sizes="(max-width: 768px) 100vw, 500px"
        src={mediaUrl}
        unoptimized={mediaUrl.startsWith("blob:")}
      />
    </div>
  ) : (
    <div className="flex aspect-square items-center justify-center bg-muted text-muted-foreground">
      <div className="text-center">
        <ImagePlus aria-hidden className="mx-auto size-8" />
        <p className="mt-2 text-sm">Add an image to preview</p>
      </div>
    </div>
  );

  return (
    <VisualPostPreviewCard
      avatarUrl={state.avatarUrl}
      className="mx-auto w-full max-w-md"
      comments={state.comments}
      dateLabel={formatPreviewDate(state.date)}
      displayName={state.displayName}
      likes={state.likes}
      media={media}
      shares={state.shares}
      text={state.text}
      username={state.username}
    />
  );
}
