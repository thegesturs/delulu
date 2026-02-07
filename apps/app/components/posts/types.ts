// Using proper Convex types
export type { Post, PostLayout } from "@/types/convex";

export const statusColors = {
  SAVED: "orange",
  SCHEDULED: "amber",
  PUBLISHED: "green",
  DELETED: "red",
  FAILED: "destructive",
  PROCESSING: "purple",
} as const;
