import { getCloudflareEnv } from "@delulu/cloudflare-types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * YouTube trimmer endpoint.
 *
 * `POST { url, start, end, maxHeight? }` → streams back a trimmed MP4.
 *
 * The heavy lifting (fetching + trimming) runs in an AWS Lambda container that
 * bundles yt-dlp + ffmpeg — the only reliable way to extract YouTube (yt-dlp
 * handles ciphers, client fallback, PoToken, and downloads ONLY the requested
 * seconds). This route is a thin, rate-limited proxy: it authenticates to the
 * Lambda with a shared secret and streams the result back to the browser.
 *
 * Same-origin (browser → this route), so no CORS. The Lambda Function URL is
 * never exposed to the client. Preview/scrubbing happens client-side via the
 * YouTube IFrame embed, so there's no resolve/proxy step here anymore.
 */

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const YOUTUBE_WWW_RE = /^www\./;
const YOUTUBE_PATH_ID_RE = /\/(?:shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})/;
const MAX_CLIP_SECONDS = 600; // 10 min per trim

// Per-IP fixed-window rate limit (KV-backed; racy but fine for abuse control).
const RATE_LIMIT = 8;
const RATE_WINDOW_SEC = 600; // 10 min

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (YOUTUBE_ID_RE.test(trimmed)) {
    return trimmed;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(YOUTUBE_WWW_RE, "");
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com"
  ) {
    const v = parsed.searchParams.get("v");
    if (v && YOUTUBE_ID_RE.test(v)) {
      return v;
    }
    const m = parsed.pathname.match(YOUTUBE_PATH_ID_RE);
    return m ? m[1] : null;
  }
  return null;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const env = await getCloudflareEnv().catch(() => null);
  // `env` for workerd; `process.env` fallback for local `next dev`.
  const lambdaUrl = env?.YOUTUBE_TRIMMER_URL ?? process.env.YOUTUBE_TRIMMER_URL;
  const secret =
    env?.YOUTUBE_TRIMMER_SECRET ?? process.env.YOUTUBE_TRIMMER_SECRET;
  if (!lambdaUrl) {
    return jsonError("Video trimming is temporarily unavailable.", 503);
  }

  // Rate limit by IP.
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "unknown";
  const kv = env?.DELULU_ARTICLES_KV;
  if (kv) {
    const windowId = Math.floor(Date.now() / (RATE_WINDOW_SEC * 1000));
    const key = `trim-rl:${ip}:${windowId}`;
    const current = Number((await kv.get(key)) ?? 0);
    if (current >= RATE_LIMIT) {
      return jsonError(
        "Too many trims — please wait a few minutes and try again.",
        429
      );
    }
    await kv.put(key, String(current + 1), { expirationTtl: RATE_WINDOW_SEC });
  }

  let body: { url?: string; start?: number; end?: number; maxHeight?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid request body", 400);
  }
  const videoId = extractVideoId(body.url ?? "");
  if (!videoId) {
    return jsonError("Could not find a YouTube video id in that URL", 400);
  }
  const start = Number(body.start);
  const end = Number(body.end);
  if (
    !(Number.isFinite(start) && Number.isFinite(end)) ||
    end <= start ||
    start < 0
  ) {
    return jsonError("Invalid start/end times", 400);
  }
  if (end - start > MAX_CLIP_SECONDS) {
    return jsonError(
      `Clip too long — max ${Math.floor(MAX_CLIP_SECONDS / 60)} minutes per trim.`,
      400
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(lambdaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "X-Trim-Secret": secret } : {}),
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        start,
        end,
        maxHeight: Number(body.maxHeight) || 720,
      }),
    });
  } catch (error) {
    console.error("[youtube-trimmer] lambda unreachable", error);
    return jsonError(
      "Trimming service is unreachable. Try again shortly.",
      502
    );
  }

  if (!upstream.ok) {
    // Pass the Lambda's JSON error straight through.
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const name of [
    "content-type",
    "content-length",
    "content-disposition",
  ]) {
    const value = upstream.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  return new Response(upstream.body, { status: 200, headers });
}
