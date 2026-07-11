"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/components/providers/api-client";
import { useActiveWorkspace } from "./use-active-workspace";

interface MediaUploadResult {
  bucketKey: string;
  url: string;
  mediaId?: string;
}

export function useMediaStorage() {
  const { workspaceId } = useActiveWorkspace();
  const { resources } = useApiClient();
  const queryClient = useQueryClient();
  const requestUpload = useMutation(resources.media.uploads(workspaceId ?? ""));
  const completeUpload = useMutation({
    ...resources.media.complete(workspaceId ?? ""),
    onSuccess: async () => {
      if (!workspaceId) {
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: resources.media.list(workspaceId).queryKey,
      });
    },
  });

  const uploadAndSaveMedia = async (file: File): Promise<MediaUploadResult> => {
    if (!workspaceId) {
      throw new Error("Select a workspace before uploading media");
    }
    const [ticket] = await requestUpload.mutateAsync([
      { filename: file.name, contentType: file.type },
    ]);
    if (!ticket) {
      throw new Error("The API did not return an upload ticket");
    }
    const response = await fetch(ticket.uploadUrl, {
      method: "PUT",
      headers: { "content-type": file.type },
      body: file,
    });
    if (!response.ok) {
      throw new Error(`Media upload failed (${response.status})`);
    }
    const [saved] = await completeUpload.mutateAsync([
      { mediaId: ticket.mediaId },
    ]);
    if (!saved) {
      throw new Error("The uploaded media could not be finalized");
    }
    return { bucketKey: saved.bucketKey, url: saved.url, mediaId: saved.id };
  };

  return {
    uploadAndSaveMedia,
    isLoading: requestUpload.isPending || completeUpload.isPending,
  };
}
