import { R2Provider } from "@delulu/api/providers/r2.provider";
import { auth } from "@delulu/auth/server";
import { getCloudflareEnv } from "@delulu/cloudflare-types";
import { api } from "@delulu/database/convex/_generated/api";
import { fetchQuery } from "@delulu/database/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
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

  // Await the params Promise
  const params = await context.params;

  if (!params.key || params.key.length === 0) {
    return new NextResponse("No key provided", { status: 400 });
  }

  // Reconstruct the key from the path segments
  const key = params.key.join("/");
  if (!key) {
    return new NextResponse("No key provided", { status: 400 });
  }

  try {
    // Get Cloudflare environment and initialize R2Provider with bucket
    const env = await getCloudflareEnv();
    const r2Provider = new R2Provider(env.DELULU_SOCIAL_BUCKET);
    console.log(`[DEBUG] Serving media file for key: ${key}`);

    const fileResult = await r2Provider.getFile(key);
    if (fileResult.isErr()) {
      console.error(
        `[ERROR] Failed to retrieve file: ${fileResult.error.message}`
      );
      // Return 404 for file not found, 500 for other errors
      const statusCode = fileResult.error.message.includes("File not found")
        ? 404
        : 500;
      return new NextResponse(
        `Error retrieving file: ${fileResult.error.message}`,
        { status: statusCode }
      );
    }

    const file = fileResult.value;
    console.log(
      `[DEBUG] File retrieved successfully: ${key} (${file.contentType}, ${file.contentLength} bytes)`
    );

    // Create response with proper headers
    const response = new NextResponse(file.content, {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
        ...(file.contentLength && {
          "Content-Length": file.contentLength.toString(),
        }),
      },
    });
    return response;
  } catch (error) {
    console.error(`[ERROR] Media serving route error: ${error}`);
    return new NextResponse("Error serving file", { status: 500 });
  }
}
