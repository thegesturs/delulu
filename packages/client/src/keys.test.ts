import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { invalidateWorkspaceResource, workspaceKeys } from "./keys.js";

describe("workspace resource invalidation", () => {
  it("invalidates every filtered posts list", async () => {
    const queryClient = new QueryClient();
    const workspaceId = "workspace_test";
    const processingKey = workspaceKeys.list(workspaceId, "posts", {
      limit: 100,
      status: "publishing",
    });
    const draftsKey = workspaceKeys.list(workspaceId, "posts", {
      limit: 100,
      status: "draft",
    });
    queryClient.setQueryData(processingKey, []);
    queryClient.setQueryData(draftsKey, []);

    await invalidateWorkspaceResource(queryClient, workspaceId, "posts");

    expect(queryClient.getQueryState(processingKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(draftsKey)?.isInvalidated).toBe(true);
  });
});
