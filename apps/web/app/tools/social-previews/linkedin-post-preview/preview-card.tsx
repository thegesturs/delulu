import { ProfessionalPostPreviewCard } from "@delulu/design-system/components/social-preview/platform-post-card";
import Image from "next/image";
import { formatPreviewDate, type PreviewState } from "../utils/preview-state";

export function LinkedInPostPreviewCard({ state }: { state: PreviewState }) {
  const mediaUrl = state.mediaUrls[0];
  const media = mediaUrl ? (
    <div className="relative aspect-[1.6] overflow-hidden bg-muted">
      <Image
        alt={state.altText || "Post preview media"}
        className="object-cover"
        fill
        sizes="(max-width: 768px) 100vw, 640px"
        src={mediaUrl}
        unoptimized={mediaUrl.startsWith("blob:")}
      />
    </div>
  ) : undefined;

  return (
    <ProfessionalPostPreviewCard
      avatarUrl={state.avatarUrl}
      className="mx-auto w-full max-w-xl"
      comments={state.comments}
      dateLabel={formatPreviewDate(state.date)}
      displayName={state.displayName}
      headline={state.headline}
      likes={state.likes}
      media={media}
      shares={state.shares}
      text={state.text}
      username={state.username}
    />
  );
}
