import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Hono } from "hono";
import { createConvexClient } from "../../lib/convex-client";
import { generatePresignedUploadUrl } from "../../lib/r2";
import { requireScope } from "../../middleware/auth";
import type { ApiKeyData, Env } from "../../types";

interface MediaEnv {
  Bindings: Env;
  Variables: { apiKey: ApiKeyData };
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const ALLOWED_CONTENT_TYPES = ["image/", "video/"];

function getExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? (parts.pop() as string) : "";
}

const media = new Hono<MediaEnv>();

// Get a presigned upload URL
media.post("/upload-url", requireScope("media:write"), async (c) => {
  const apiKey = c.get("apiKey");
  const body = await c.req.json();

  const { fileName, contentType, fileSize } = body as {
    fileName?: string;
    contentType?: string;
    fileSize?: number;
  };

  if (!(fileName && contentType)) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "fileName and contentType are required",
        },
      },
      400
    );
  }

  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: `File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
      },
      400
    );
  }

  if (!ALLOWED_CONTENT_TYPES.some((prefix) => contentType.startsWith(prefix))) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "contentType must start with image/ or video/",
        },
      },
      400
    );
  }

  const ext = getExtension(fileName);
  const bucketKey = `${apiKey.userId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

  const { uploadUrl } = await generatePresignedUploadUrl(
    c.env,
    bucketKey,
    contentType
  );

  return c.json({
    data: {
      uploadUrl,
      bucketKey,
      downloadUrl: `https://media.delulu.social/${bucketKey}`,
    },
  });
});

// Save a media record after upload
media.post("/", requireScope("media:write"), async (c) => {
  const apiKey = c.get("apiKey");
  const body = await c.req.json();

  const { bucketKey, mediaType, originalFilename, size, extension, altText } =
    body as {
      bucketKey?: string;
      mediaType?: string;
      originalFilename?: string;
      size?: number;
      extension?: string;
      altText?: string;
    };

  if (!(bucketKey && mediaType)) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "bucketKey and mediaType are required",
        },
      },
      400
    );
  }

  if (mediaType !== "IMAGE" && mediaType !== "VIDEO") {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: 'mediaType must be "IMAGE" or "VIDEO"',
        },
      },
      400
    );
  }

  const url = `https://media.delulu.social/${bucketKey}`;

  const convex = createConvexClient(c.env);
  const id = await convex.mutation(api.media.apiCreateMedia, {
    userId: apiKey.userId as Id<"users">,
    bucketKey,
    url,
    mediaType,
    originalFilename,
    size,
    extension,
    altText,
  });

  return c.json({ data: { id } }, 201);
});

export default media;
