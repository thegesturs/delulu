import type { ContentType, SocialProviderType } from '@delulu/validators/post';

interface UploadMediaResult {
  bucketKey: string;
  url: string;
}

export async function uploadSingleFile(file: File): Promise<UploadMediaResult> {
  const startTime = Date.now();
  console.log(
    `[CLIENT] Starting upload: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
  );

  // Upload directly through the API (file is processed server-side)
  const formData = new FormData();
  formData.append('file', file);

  const uploadStart = Date.now();
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  console.log(
    `[CLIENT] Upload request took ${Date.now() - uploadStart}ms`
  );

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  const { bucketKey } = (await response.json()) as {
    uploadUrl: string | null; // Ignored - always null for direct uploads
    bucketKey: string;
  };

  // Get download URL after successful upload
  const urlStart = Date.now();
  const downloadUrl = await getDownloadUrl(bucketKey);
  console.log(
    `[CLIENT] Get download URL took ${Date.now() - urlStart}ms, total: ${Date.now() - startTime}ms`
  );

  // Note: Media will be saved to database when the post is published
  // For now, we just return the upload result

  return { bucketKey, url: downloadUrl };
}

async function getDownloadUrl(key: string): Promise<string> {
  const response = await fetch(`/api/upload?key=${encodeURIComponent(key)}`);
  if (!response.ok) {
    throw new Error('Failed to get download URL');
  }
  const { downloadUrl } = (await response.json()) as {
    downloadUrl: string;
  };
  return downloadUrl;
}

export async function uploadContentMedia(
  contents: ContentType[]
): Promise<ContentType[]> {
  const updatedContents = await Promise.all(
    contents.map(async (content) => {
      const updatedMedia = await Promise.all(
        content.media.map(async (media) => {
          // If there's a bucketKey but no url, get a fresh download URL
          if (media.bucketKey && !media.url) {
            const downloadUrl = await getDownloadUrl(media.bucketKey);
            return {
              ...media,
              url: downloadUrl,
            };
          }
          return media;
        })
      );

      return {
        ...content,
        media: updatedMedia,
      };
    })
  );

  return updatedContents;
}

export async function uploadAllContentMedia(
  mainContent: ContentType[],
  alternativeContent: {
    socialProvider: SocialProviderType;
    content: ContentType[];
  }[] = []
): Promise<{
  mainContent: ContentType[];
  alternativeContent: {
    socialProvider: SocialProviderType;
    content: ContentType[];
  }[];
}> {
  const updatedMainContent = await uploadContentMedia(mainContent);

  const updatedAlternativeContent = await Promise.all(
    alternativeContent.map(async (altContent) => ({
      ...altContent,
      content: await uploadContentMedia(altContent.content),
    }))
  );

  return {
    mainContent: updatedMainContent,
    alternativeContent: updatedAlternativeContent,
  };
}
