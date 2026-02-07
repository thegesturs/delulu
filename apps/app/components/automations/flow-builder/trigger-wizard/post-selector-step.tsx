"use client";

import { PostSelector } from "@/components/automations/post-selector";

interface PostSelectorStepProps {
  socialProviderId: string;
  selectedPostIds: string[];
  onSelectionChange: (postIds: string[]) => void;
}

export function PostSelectorStep({
  socialProviderId,
  selectedPostIds,
  onSelectionChange,
}: PostSelectorStepProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">Select Target Posts</h3>
        <p className="text-muted-foreground text-sm">
          Which posts should this trigger monitor for comments?
        </p>
      </div>
      <PostSelector
        onSelectionChange={onSelectionChange}
        selectedPostIds={selectedPostIds}
        socialProviderId={socialProviderId}
      />
    </div>
  );
}
