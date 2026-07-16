"use client";

import { ProfessionalPostPreviewCard } from "@delulu/design-system/components/social-preview/platform-post-card";
import Image from "next/image";
import { PhoneFrame } from "./phone-frame";
import { usePreviewData } from "./preview-utils";

interface LinkedInPreviewProps {
  postData?: Parameters<typeof usePreviewData>[1];
}

export function LinkedInPreview({ postData }: LinkedInPreviewProps = {}) {
  const { content, mediaUrl, hasVideo, hasImage, provider } = usePreviewData(
    "LINKEDIN",
    postData
  );

  if (!content) {
    return null;
  }

  return (
    <PhoneFrame>
      {/* LinkedIn Header */}
      <div className="flex items-center justify-between border-neutral-200 border-b bg-white px-4 pt-10 pb-2 dark:border-neutral-700 dark:bg-neutral-900">
        <span className="font-bold text-[#0A66C2] text-lg">in</span>
        <div className="mx-3 h-7 flex-1 rounded-sm bg-neutral-100 dark:bg-neutral-800" />
        <div className="h-6 w-6 rounded-full bg-neutral-200 dark:bg-neutral-700" />
      </div>

      {/* Post Card */}
      <div
        className="overflow-y-auto bg-neutral-100 dark:bg-neutral-950"
        style={{ height: "calc(100% - 55px)" }}
      >
        <ProfessionalPostPreviewCard
          avatarUrl={provider?.profileImage}
          className="mt-2 rounded-none border-0 shadow-none"
          comments={23}
          dateLabel="2h"
          displayName={provider?.fullName}
          headline={provider?.username || "Headline"}
          likes={847}
          media={
            (hasVideo || hasImage) && mediaUrl ? (
              <div className="relative w-full" style={{ height: 250 }}>
                {hasVideo ? (
                  <video
                    autoPlay
                    className="h-full w-full object-cover"
                    loop
                    muted
                    playsInline
                    src={mediaUrl}
                  />
                ) : (
                  <Image
                    alt="Preview"
                    className="object-cover"
                    fill
                    src={mediaUrl}
                  />
                )}
              </div>
            ) : undefined
          }
          shares={0}
          text={content.text || "Share your thoughts..."}
        />
      </div>
    </PhoneFrame>
  );
}
