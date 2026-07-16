import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import type { ApiClient } from "@delulu/client";
import { runEffect } from "@delulu/client";

const mimeForPath = (path: string) => {
  const extension = extname(path).toLowerCase();
  const values: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
  };
  const contentType = values[extension];
  if (!contentType) {
    throw new Error(`Unsupported media extension: ${extension || "(none)"}`);
  }
  return contentType;
};

export const uploadLocalMedia = async (input: {
  client: ApiClient;
  workspaceId: string;
  path: string;
  altText?: string;
}) => {
  const file = await stat(input.path);
  if (!file.isFile()) {
    throw new Error("Media path must be a regular file");
  }
  const contentType = mimeForPath(input.path);
  const [upload] = await runEffect(
    input.client.media.uploads({
      params: { workspaceId: input.workspaceId },
      payload: [
        {
          filename: basename(input.path),
          contentType,
          altText: input.altText,
        },
      ],
    })
  );
  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: {
      "content-type": contentType,
      "content-length": String(file.size),
    },
    body: createReadStream(input.path) as unknown as BodyInit,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
  const completed = await runEffect(
    input.client.media.complete({
      params: { workspaceId: input.workspaceId },
      payload: [{ mediaId: upload.mediaId }],
    })
  );
  return completed[0];
};
