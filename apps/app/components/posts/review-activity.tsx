"use client";

import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  ArrowUp01Icon,
  CancelCircleIcon,
  Comment01Icon,
  Tick01Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import React from "react";
import { toast } from "sonner";

interface ReviewActivityProps {
  postId: Id<"posts">;
}

const activityConfig = {
  SUBMITTED: {
    icon: ArrowUp01Icon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "submitted for review",
  },
  RESUBMITTED: {
    icon: ArrowUp01Icon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "resubmitted for review",
  },
  APPROVED: {
    icon: Tick01Icon,
    color: "text-green-500",
    bg: "bg-green-500/10",
    label: "approved",
  },
  REJECTED: {
    icon: CancelCircleIcon,
    color: "text-red-500",
    bg: "bg-red-500/10",
    label: "declined",
  },
  COMMENT: {
    icon: Comment01Icon,
    color: "text-muted-foreground",
    bg: "bg-muted",
    label: "commented",
  },
} as const;

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) {
    return "just now";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return new Date(timestamp).toLocaleDateString();
}

export function ReviewActivity({ postId }: ReviewActivityProps) {
  const activities = useQuery(api.post_reviews.getReviewActivity, { postId });
  const [newComment, setNewComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const addCommentMutation = useMutation(api.post_reviews.addReviewComment);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await addCommentMutation({ postId, comment: newComment.trim() });
      setNewComment("");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activities) {
    return (
      <div className="py-4 text-center text-muted-foreground text-sm">
        Loading activity...
      </div>
    );
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">Activity</h4>

      {/* Timeline */}
      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute top-3 bottom-3 left-3.5 w-px bg-border" />

        {activities.map((activity) => {
          const config = activityConfig[activity.type];
          return (
            <div className="relative flex gap-3 pb-4" key={activity._id}>
              {/* Icon dot */}
              <div
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.bg}`}
              >
                <Icon className={config.color} icon={config.icon} size={14} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-medium text-sm">
                    {activity.userName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {config.label}
                  </span>
                  <span className="ml-auto shrink-0 text-muted-foreground text-xs">
                    {timeAgo(activity.createdAt)}
                  </span>
                </div>

                {activity.comment && (
                  <div className="mt-1.5 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    {activity.comment}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add comment */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isSubmitting}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
          placeholder="Add a comment..."
          value={newComment}
        />
        <Button
          disabled={isSubmitting || !newComment.trim()}
          onClick={handleAddComment}
          size="sm"
          variant="ghost"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
