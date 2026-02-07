"use client";

import { api } from "@delulu/database/convex/_generated/api";
import { useQuery } from "convex-helpers/react/cache";
import { DashboardContent } from "./dashboard-content";

export function DashboardClient() {
  // Get dashboard data
  const dashboardStats = useQuery(api.stats.getDashboardStats);
  const recentPosts = useQuery(api.posts.getPosts, {
    paginationOpts: { numItems: 6, cursor: null },
  });
  const upcomingPosts = useQuery(api.stats.getUpcomingPosts, { days: 7 });

  const isLoading = !(dashboardStats && recentPosts);

  return (
    <DashboardContent
      dashboardStats={dashboardStats ?? null}
      isLoading={isLoading}
      upcomingPosts={upcomingPosts ?? null}
    />
  );
}
