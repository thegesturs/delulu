import type { ContentType, SocialProviderType } from "@delulu/validators/post";

interface UploadMediaResult {
  bucketKey: string;
  url: string;
}

export async function uploadSingleFile(file: File): Promise<UploadMediaResult> {
  const startTime = Date.now();
  console.log(
    `[CLIENT] Starting upload: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
  );

  // Step 1: Get presigned URL
  const presignedStart = Date.now();
  const presignedResponse = await fetch("/api/upload/presigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });
  console.log(
    `[CLIENT] Presigned URL request took ${Date.now() - presignedStart}ms`
  );

  if (!presignedResponse.ok) {
    throw new Error("Failed to get presigned URL");
  }

  const { uploadUrl, key } = (await presignedResponse.json()) as {
    uploadUrl: string;
    key: string;
  };

  // Step 2: Upload directly to R2 using presigned URL
  const uploadStart = Date.now();
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });
  console.log(`[CLIENT] Direct R2 upload took ${Date.now() - uploadStart}ms`);

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload to R2");
  }

  // Step 3: Get download URL
  const urlStart = Date.now();
  const downloadUrl = await getDownloadUrl(key);
  console.log(
    `[CLIENT] Get download URL took ${Date.now() - urlStart}ms, total: ${Date.now() - startTime}ms`
  );

  return { bucketKey: key, url: downloadUrl };
}

async function getDownloadUrl(key: string): Promise<string> {
  const response = await fetch(`/api/upload?key=${encodeURIComponent(key)}`);
  if (!response.ok) {
    throw new Error("Failed to get download URL");
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
