import { type UpsertInput, upsertArticles } from "@delulu/articles";
import { getCloudflareEnv } from "@delulu/cloudflare-types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

interface OutrankArticle {
  id: string;
  title: string;
  slug: string;
  content_markdown: string;
  content_html: string;
  meta_description: string;
  image_url?: string | null;
  tags?: string[];
  created_at: string;
}

interface OutrankPayload {
  event_type: string;
  timestamp?: string;
  data?: { articles?: OutrankArticle[] };
}

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const env = await getCloudflareEnv();
  const expectedSecret = env.OUTRANK_WEBHOOK_SECRET;
  const authHeader = request.headers.get("Authorization");

  if (
    !(expectedSecret && authHeader) ||
    authHeader !== `Bearer ${expectedSecret}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: OutrankPayload;
  try {
    body = (await request.json()) as OutrankPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.event_type !== "publish_articles") {
    return NextResponse.json({
      message: `Ignored event type: ${body.event_type}`,
    });
  }

  const webhookTimestamp = body.timestamp
    ? new Date(body.timestamp).getTime()
    : Date.now();

  const articles: UpsertInput[] = (body.data?.articles ?? []).map((a) => ({
    outrankId: a.id,
    title: a.title,
    slug: a.slug,
    contentMarkdown: a.content_markdown,
    contentHtml: a.content_html,
    metaDescription: a.meta_description,
    imageUrl: a.image_url ?? undefined,
    tags: a.tags ?? [],
    outrankCreatedAt: new Date(a.created_at).getTime(),
    publishedAt: webhookTimestamp,
  }));

  try {
    const result = await upsertArticles(
      env.DELULU_ARTICLES_BUCKET,
      env.DELULU_ARTICLES_KV,
      articles
    );
    return NextResponse.json({ success: true, processed: result.written });
  } catch (error) {
    console.error("Error in outrank-webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
