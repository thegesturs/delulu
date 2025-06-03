import type { ContentType, SocialProviderType } from '@delulu/validators/post';

interface UploadMediaResult {
  bucketKey: string;
}

async function uploadSingleFile(file: File): Promise<UploadMediaResult> {
  // Get the presigned URL
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to get upload URL');
  }

  const { uploadUrl, bucketKey } = await response.json();

  console.log('uploadUrl', uploadUrl);

  // Upload directly to R2 using the presigned URL
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Failed to upload file: ${errorText}`);
  }

  return { bucketKey };
}

async function getDownloadUrl(key: string): Promise<string> {
  const response = await fetch(`/api/upload?key=${encodeURIComponent(key)}`);
  if (!response.ok) {
    throw new Error('Failed to get download URL');
  }
  const { downloadUrl } = await response.json();
  return downloadUrl;
}

export async function uploadContentMedia(
  contents: ContentType[]
): Promise<ContentType[]> {
  const updatedContents = await Promise.all(
    contents.map(async (content) => {
      const updatedMedia = await Promise.all(
        content.media.map(async (media) => {
          if (!media.file) {
            // If there's a bucketKey but no file, get a fresh download URL
            if (media.bucketKey) {
              const downloadUrl = await getDownloadUrl(media.bucketKey);
              return {
                ...media,
                url: downloadUrl,
              };
            }
            return media;
          }

          const result = await uploadSingleFile(media.file);
          const downloadUrl = await getDownloadUrl(result.bucketKey);

          return {
            ...media,
            url: downloadUrl,
            bucketKey: result.bucketKey,
          };
        })
      );

      return {
        ...content,
        media: updatedMedia,
      };
    })
  );

  console.log('updatedContents', updatedContents);

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
