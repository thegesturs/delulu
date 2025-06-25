import type { ContentType, SocialProviderType } from '@delulu/validators/post';

interface UploadMediaResult {
  bucketKey: string;
  url: string;
}

export async function uploadSingleFile(file: File): Promise<UploadMediaResult> {
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

  // Get download URL after successful upload
  const downloadUrl = await getDownloadUrl(bucketKey);

  // Note: Media will be saved to database when the post is published
  // For now, we just return the upload result

  return { bucketKey, url: downloadUrl };
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
