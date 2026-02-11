"use client";

import { PostSelector } from "@/components/automations/post-selector";
import type { AutomationTriggerType } from "../utils/flow-types";

interface PostSelectorStepProps {
  socialProviderId: string;
  selectedPostIds: string[];
  onSelectionChange: (postIds: string[]) => void;
  triggerType?: AutomationTriggerType;
}

export function PostSelectorStep({
  socialProviderId,
  selectedPostIds,
  onSelectionChange,
  triggerType,
}: PostSelectorStepProps) {
  const isStory = triggerType === "STORY_REPLY";

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">
          {isStory ? "Select Target Stories" : "Select Target Posts"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {isStory
            ? "Which stories should this trigger monitor for replies?"
            : "Which posts should this trigger monitor for comments?"}
        </p>
      </div>
      <PostSelector
        onSelectionChange={onSelectionChange}
        selectedPostIds={selectedPostIds}
        socialProviderId={socialProviderId}
        triggerType={triggerType}
      />
    </div>
  );
}
