import { api } from "@delulu/database/convex/_generated/api";
import { useMutation } from "convex/react";
import { uploadSingleFile } from "./use-upload-media";

interface MediaUploadResult {
  bucketKey: string;
  url: string;
  mediaId?: string;
}

export function useMediaStorage() {
  const createMedia = useMutation(api.media.createMedia);

  const uploadAndSaveMedia = async (file: File): Promise<MediaUploadResult> => {
    // First upload the file
    const uploadResult = await uploadSingleFile(file);

    try {
      // Then save media details to database
      const extension = file.name.split(".").pop() || "";
      const mediaData = {
        bucketKey: uploadResult.bucketKey,
        url: uploadResult.url,
        mediaType: file.type.startsWith("image/")
          ? ("IMAGE" as const)
          : file.type.startsWith("video/")
            ? ("VIDEO" as const)
            : ("DOCUMENT" as const),
        originalFilename: file.name,
        size: file.size,
        extension,
      };
      console.log("mediaData", mediaData);

      const savedMedia = await createMedia(mediaData);

      return {
        ...uploadResult,
        mediaId: savedMedia,
      };
    } catch {
      // Return upload result even if database save fails
      return uploadResult;
    }
  };

  return {
    uploadAndSaveMedia,
    isLoading: false, // Convex mutation doesn't expose loading state in the same way
  };
}
