import { randomUUID } from "node:crypto";
import { R2Provider } from "@delulu/api/providers/r2.provider";
import { auth } from "@delulu/auth/server";
import { getCloudflareEnv } from "@delulu/cloudflare-types";
import { api } from "@delulu/database/convex/_generated/api";
import { fetchQuery } from "@delulu/database/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const token = await getToken({ template: "convex" });

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await fetchQuery(
    api.users.getUserByExternalId,
    { externalId: userId },
    { token }
  );

  if (!user?._id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    // Initialize R2Provider with the bucket from environment
    const env = await getCloudflareEnv();
    const r2Provider = new R2Provider(env.DELULU_SOCIAL_BUCKET);

    const fileExtension = file.name.split(".").pop() || "";
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    const key = `${userId}/${uniqueFileName}`;

    const startTime = Date.now();
    console.log(
      `[DEBUG] Starting upload: ${file.name} (${file.type}) as key: ${key}, size: ${file.size} bytes`
    );

    // Upload file directly to R2 - in Cloudflare Workers, File is already the right type
    // R2 will handle it efficiently without loading entire file into memory
    const uploadStart = Date.now();
    const uploadResult = await r2Provider.uploadFileStream(
      key,
      file,
      file.type
    );
    console.log(
      `[DEBUG] R2 upload took ${Date.now() - uploadStart}ms, total: ${Date.now() - startTime}ms`
    );

    if (uploadResult.isErr()) {
      console.error(`[ERROR] Upload failed: ${uploadResult.error.message}`);
      return new NextResponse(
        `Error uploading file: ${uploadResult.error.message}`,
        { status: 500 }
      );
    }

    const result = uploadResult.value;
    console.log(`[DEBUG] Upload successful for key: ${result.key}`);

    return NextResponse.json({
      bucketKey: result.key,
    });
  } catch {
    return new NextResponse("Error uploading file", { status: 500 });
  }
}

// Add a new route to get download URLs
export async function GET(request: NextRequest) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const token = await getToken({ template: "convex" });

  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await fetchQuery(
    api.users.getUserByExternalId,
    { externalId: userId },
    { token }
  );
  if (!user?._id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return new NextResponse("No key provided", { status: 400 });
  }

  try {
    // Get Cloudflare environment and initialize R2Provider with bucket
    const env = await getCloudflareEnv();
    const r2Provider = new R2Provider(env.DELULU_SOCIAL_BUCKET);

    console.log(`[DEBUG] Getting download URL for key: ${key}`);

    const downloadUrl = await r2Provider.getSignedDownloadUrl(key);

    if (downloadUrl.isErr()) {
      console.error(
        `[ERROR] Download URL generation failed: ${downloadUrl.error.message}`
      );
      return new NextResponse(
        `Error generating download URL: ${downloadUrl.error.message}`,
        { status: 500 }
      );
    }

    console.log(
      `[DEBUG] Download URL generated successfully: ${downloadUrl.value}`
    );
    return NextResponse.json({ downloadUrl: downloadUrl.value });
  } catch (error) {
    console.error(`[ERROR] Download URL route error: ${error}`);
    return new NextResponse("Error generating download URL", { status: 500 });
  }
}
