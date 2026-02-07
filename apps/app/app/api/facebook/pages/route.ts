import { auth } from "@delulu/auth/server";
import { getCloudflareEnv } from "@delulu/cloudflare-types";
import { decryptData } from "@delulu/database/convex/utils";
import {
  type FacebookPagesPublic,
  type FacebookPagesWithToken,
  FacebookPagesWithTokenSchema,
} from "@delulu/validators/facebook";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get("key");

    if (!key) {
      return new NextResponse(null, { status: 400 });
    }

    // Verify the key belongs to the current user
    if (!key.startsWith(`fb-pages-${userId}-`)) {
      return new NextResponse(null, { status: 403 });
    }

    const env = await getCloudflareEnv();

    const encryptedData = await env.DELULU_FACEBOOK_PAGES.get(key);

    if (!encryptedData) {
      return new NextResponse(null, { status: 404 });
    }

    // Decrypt the data and validate with proper schema
    const decryptedData = await decryptData(encryptedData);
    const rawPages = JSON.parse(decryptedData);

    // Validate the data structure with Zod schema
    const pagesValidationResult =
      FacebookPagesWithTokenSchema.safeParse(rawPages);
    if (!pagesValidationResult.success) {
      console.error(
        "Invalid Facebook pages data structure:",
        pagesValidationResult.error
      );
      return new NextResponse(null, { status: 500 });
    }

    const pages: FacebookPagesWithToken = pagesValidationResult.data;

    // Remove access_token from each page before sending to frontend
    const sanitizedPages: FacebookPagesPublic = pages.map(
      ({ access_token, ...page }) => page
    );

    return NextResponse.json(sanitizedPages);
  } catch (error) {
    console.error("Error fetching Facebook pages:", error);
    return new NextResponse(null, { status: 500 });
  }
}
