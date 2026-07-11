import { makeSimplePostWrite } from "@delulu/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useApiClient } from "@/components/providers/api-client";
import { useWorkspace } from "@/components/providers/workspace";
import { useUsageLimit } from "@/hooks/use-usage-limits";
import { useDateTime, usePost, useSelectedSocialProviders } from "@/store/post";

export function usePostActions() {
  const { date } = useDateTime();
  const post = usePost();
  const selected = useSelectedSocialProviders();
  const { id: postId } = useParams<{ id: string | undefined }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { workspaceId } = useWorkspace();
  const { resources } = useApiClient();
  const connections = useQuery({
    ...resources.connections.list(workspaceId ?? "", { limit: 100 }),
    enabled: Boolean(workspaceId),
  });
  const usage = useQuery({
    ...resources.billing.usage(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
  });
  const createPost = useMutation(resources.posts.create(workspaceId ?? ""));
  const updatePost = useMutation(
    resources.posts.update(workspaceId ?? "", postId ?? "")
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const monthlyPostsCount = usage.data?.usage.monthlyPosts ?? 0;
  const monthlyPostsLimit = useUsageLimit("monthlyPosts", monthlyPostsCount);
  const isAtPostLimit = !(
    monthlyPostsLimit.isUnlimited || monthlyPostsLimit.allowed
  );

  const write = async (scheduledAt: string | null, asDraft = false) => {
    if (!workspaceId) {
      throw new Error("Select a workspace before saving a post");
    }
    if (!asDraft && isAtPostLimit) {
      throw new Error("You have reached your monthly post limit");
    }
    const byId = new Map(
      (connections.data?.data ?? []).map((item) => [item.id, item])
    );
    const targets = asDraft
      ? []
      : selected.map((item) => {
          const connection = byId.get(item.socialId);
          if (!connection) {
            throw new Error(`Connection ${item.name} is no longer available`);
          }
          return { id: connection.id, platform: connection.platform };
        });
    const content = post.content[0];
    const payload = makeSimplePostWrite({
      caption: content?.text ?? "",
      connections: targets,
      mediaIds: (content?.media ?? []).flatMap((media) =>
        media.id ? [media.id] : []
      ),
      scheduledAt,
    });
    const result = postId
      ? await updatePost.mutateAsync(payload)
      : await createPost.mutateAsync(payload);
    await queryClient.invalidateQueries({
      queryKey: resources.posts.list(workspaceId).queryKey,
    });
    return result;
  };

  const run = async (
    action: () => Promise<unknown>,
    success: string,
    failure: string,
    destination: string
  ) => {
    try {
      setIsProcessing(true);
      await action();
      toast.success(success);
      router.push(destination);
    } catch (error) {
      toast.error(failure, {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handlePostNow: () =>
      run(
        () => write(null),
        "Post sent for processing, will be published shortly.",
        "Failed to publish post",
        "/posts?status=publishing"
      ),
    handleSchedulePost: () =>
      date
        ? run(
            () => write(date.toISOString()),
            "Post scheduled successfully",
            "Failed to schedule post",
            "/posts?status=scheduled"
          )
        : Promise.resolve(),
    handleSaveAsDraft: () =>
      run(
        () => write(null, true),
        postId ? "Post updated successfully" : "Post saved successfully",
        postId ? "Failed to update post" : "Failed to save post",
        "/posts?status=draft"
      ),
    isProcessing,
    isAtPostLimit,
    date,
    postId,
  };
}
