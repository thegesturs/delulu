import { useCreateMedia } from './use-media';
import { uploadSingleFile } from './use-upload-media';

interface MediaUploadResult {
  bucketKey: string;
  url: string;
  mediaId?: string;
}

export function useMediaStorage() {
  const createMediaMutation = useCreateMedia();

  const uploadAndSaveMedia = async (file: File): Promise<MediaUploadResult> => {
    // First upload the file
    const uploadResult = await uploadSingleFile(file);

    try {
      // Then save media details to database
      const extension = file.name.split('.').pop() || '';
      const mediaData = {
        bucketKey: uploadResult.bucketKey,
        url: uploadResult.url,
        mediaType: file.type.startsWith('image/')
          ? ('IMAGE' as const)
          : ('VIDEO' as const),
        originalFilename: file.name,
        size: file.size,
        extension,
      };

      const savedMedia = await createMediaMutation.mutateAsync(mediaData);

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
    isLoading: createMediaMutation.isPending,
  };
}
