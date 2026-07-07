import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Innertube, type YT } from "youtubei.js";

type VideoInfo = YT.VideoInfo;

/**
 * YouTube resolve + proxy endpoint for the in-browser video trimmer.
 *
 * The browser cannot fetch YouTube's video bytes directly (CORS + ciphered,
 * throttled googlevideo URLs). This route runs as a Cloudflare Worker (default
 * Node runtime — do NOT switch to `edge`, youtubei.js needs Node APIs) and:
 *
 *  - `?mode=resolve&url=<youtube url>`  → metadata + selectable progressive formats
 *  - `?mode=proxy&id=<videoId>&itag=<n>` → streams the chosen format's bytes with
 *     CORS + forwarded Range headers (never buffered in the Worker).
 *
 * Resolve prefers a PROGRESSIVE (muxed) stream when available — it plays directly
 * in `<video>` and trims with a plain stream copy. Most videos have no muxed
 * format, so it falls back to an ADAPTIVE video-only + audio-only pair; the browser
 * muxes those with ffmpeg.wasm while trimming. The response `mode` field tells the
 * client which path to take.
 *
 * Reliability: the default WEB client frequently returns UNPLAYABLE (bot / PoToken
 * gate), so `getPlayableInfo` falls back across the iOS / Android / TV-embedded
 * clients, which return playable muxed streams without a PoToken. Deciphered
 * stream URLs are cached in-memory (per warm isolate) so `proxy` usually avoids a
 * second `getInfo` call. All YouTube access is isolated here so the resolver could
 * later be swapped for a public Piped/Invidious instance without changing the
 * route contract.
 */

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const YOUTUBE_WWW_RE = /^www\./;
const YOUTUBE_PATH_ID_RE = /\/(?:shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})/;

// Clients tried in order until one returns a playable muxed stream.
const CLIENT_FALLBACKS = ["IOS", "ANDROID", "TV_EMBEDDED", "WEB"] as const;

// Deciphered stream URL cache (videoId:itag -> { url, expiresAt }).
const urlCache = new Map<string, { url: string; expiresAt: number }>();
const URL_CACHE_TTL_MS = 60 * 60 * 1000; // 1h (googlevideo URLs live ~6h)

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (VIDEO_ID_RE.test(trimmed)) {
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
    return VIDEO_ID_RE.test(id) ? id : null;
  }
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com"
  ) {
    const v = parsed.searchParams.get("v");
    if (v && VIDEO_ID_RE.test(v)) {
      return v;
    }
    const match = parsed.pathname.match(YOUTUBE_PATH_ID_RE);
    return match ? match[1] : null;
  }
  return null;
}

let innertubePromise: Promise<Innertube> | null = null;
function getInnertube(): Promise<Innertube> {
  innertubePromise ??= Innertube.create({
    fetch: (input, init) => fetch(input as RequestInfo, init as RequestInit),
    retrieve_player: true,
  });
  return innertubePromise;
}

type Format = NonNullable<VideoInfo["streaming_data"]>["formats"][number];

function progressiveFormats(info: VideoInfo): Format[] {
  return (info.streaming_data?.formats ?? []).filter(
    (f) => f.has_audio && f.has_video
  );
}

function adaptiveFormats(info: VideoInfo): Format[] {
  return info.streaming_data?.adaptive_formats ?? [];
}

/** Best H.264/MP4 video-only track, capped at 720p to keep browser memory sane. */
function pickAdaptiveVideo(info: VideoInfo): Format | undefined {
  const videos = adaptiveFormats(info)
    .filter(
      (f) =>
        f.has_video &&
        !f.has_audio &&
        (f.mime_type?.includes("mp4") ?? false) &&
        (f.mime_type?.includes("avc1") ?? false)
    )
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  return videos.find((f) => (f.height ?? 0) <= 720) ?? videos.at(-1);
}

/** Best AAC/MP4 audio-only track. */
function pickAdaptiveAudio(info: VideoInfo): Format | undefined {
  return adaptiveFormats(info)
    .filter(
      (f) =>
        f.has_audio && !f.has_video && (f.mime_type?.includes("mp4") ?? false)
    )
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0];
}

/** A muxed progressive stream, or a video-only + audio-only pair to combine. */
function hasUsableStreams(info: VideoInfo): boolean {
  return (
    progressiveFormats(info).length > 0 ||
    Boolean(pickAdaptiveVideo(info) && pickAdaptiveAudio(info))
  );
}

/** Try each client until one yields a playable video with usable streams. */
async function getPlayableInfo(
  yt: Innertube,
  videoId: string
): Promise<VideoInfo | null> {
  let last: VideoInfo | null = null;
  for (const client of CLIENT_FALLBACKS) {
    try {
      const info = await yt.getInfo(videoId, { client });
      last = info;
      if (info.playability_status?.status === "OK" && hasUsableStreams(info)) {
        return info;
      }
    } catch (error) {
      console.error(`[youtube-trimmer] getInfo(${client}) failed`, error);
    }
  }
  return last;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type",
  "Access-Control-Expose-Headers":
    "Content-Length, Content-Range, Accept-Ranges",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "resolve";
  if (mode === "resolve") {
    return handleResolve(searchParams);
  }
  if (mode === "proxy") {
    return handleProxy(request, searchParams);
  }
  return jsonError(`Unknown mode: ${mode}`, 400);
}

async function handleResolve(searchParams: URLSearchParams) {
  const rawUrl = searchParams.get("url");
  if (!rawUrl) {
    return jsonError("Missing `url` parameter", 400);
  }
  const videoId = extractVideoId(rawUrl);
  if (!videoId) {
    return jsonError("Could not find a YouTube video id in that URL", 400);
  }

  let info: VideoInfo | null;
  try {
    const yt = await getInnertube();
    info = await getPlayableInfo(yt, videoId);
  } catch (error) {
    console.error("[youtube-trimmer] resolve failed", error);
    return jsonError(
      "Could not load that video. It may be private, age-restricted, or unavailable.",
      502
    );
  }

  if (!info) {
    return jsonError("Could not load that video.", 502);
  }
  if (info.basic_info.is_live) {
    return jsonError("Live streams can't be trimmed.", 400);
  }

  const yt = await getInnertube();
  const player = yt.session.player;
  const now = Date.now();

  // Pre-decipher + cache a format's URL so the proxy call is instant (and avoids
  // a second getInfo that can trip bot detection).
  const cacheUrl = async (format: Format) => {
    if (!player) {
      return;
    }
    try {
      urlCache.set(`${videoId}:${format.itag}`, {
        url: await format.decipher(player),
        expiresAt: now + URL_CACHE_TTL_MS,
      });
    } catch {
      // Non-fatal — the proxy will re-resolve on demand.
    }
  };

  const base = {
    videoId,
    title: info.basic_info.title ?? "Untitled",
    durationSec: info.basic_info.duration ?? 0,
    thumbnail: (info.basic_info.thumbnail ?? []).at(-1)?.url ?? null,
  };

  const progressive = progressiveFormats(info);
  if (progressive.length > 0) {
    // Single muxed stream: plays in <video> and trims with a plain stream copy.
    for (const f of progressive) {
      await cacheUrl(f);
    }
    const formats = progressive
      .map((f) => ({
        itag: f.itag,
        qualityLabel: f.quality_label ?? f.quality ?? "unknown",
        approxSizeBytes: f.content_length ? Number(f.content_length) : null,
        height: f.height ?? null,
      }))
      .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
    return NextResponse.json(
      { ...base, mode: "progressive", formats },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  // No muxed format (common — most videos are adaptive-only). Return a
  // video-only + audio-only pair; the browser muxes them with ffmpeg.wasm.
  const video = pickAdaptiveVideo(info);
  const audio = pickAdaptiveAudio(info);
  if (!(video && audio)) {
    return jsonError(
      "This video has no downloadable format available. Try a different video.",
      422
    );
  }
  await cacheUrl(video);
  await cacheUrl(audio);
  return NextResponse.json(
    {
      ...base,
      mode: "adaptive",
      video: {
        itag: video.itag,
        qualityLabel: video.quality_label ?? `${video.height ?? ""}p`,
        approxSizeBytes: video.content_length
          ? Number(video.content_length)
          : null,
        height: video.height ?? null,
      },
      audio: {
        itag: audio.itag,
        approxSizeBytes: audio.content_length
          ? Number(audio.content_length)
          : null,
      },
    },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}

async function resolveStreamUrl(
  videoId: string,
  itag: number
): Promise<string | null> {
  const cacheKey = `${videoId}:${itag}`;
  const cached = urlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const yt = await getInnertube();
  const info = await getPlayableInfo(yt, videoId);
  if (!info) {
    return null;
  }
  // The requested itag may be progressive OR adaptive (video-only / audio-only).
  const allFormats = [...progressiveFormats(info), ...adaptiveFormats(info)];
  const format =
    (Number.isNaN(itag)
      ? allFormats[0]
      : allFormats.find((f) => f.itag === itag)) ?? allFormats[0];
  const player = yt.session.player;
  if (!(format && player)) {
    return null;
  }
  const url = await format.decipher(player);
  urlCache.set(cacheKey, { url, expiresAt: Date.now() + URL_CACHE_TTL_MS });
  return url;
}

async function handleProxy(
  request: NextRequest,
  searchParams: URLSearchParams
) {
  const videoId = searchParams.get("id");
  const itagParam = searchParams.get("itag");
  if (!(videoId && VIDEO_ID_RE.test(videoId))) {
    return jsonError("Missing or invalid `id`", 400);
  }

  let streamUrl: string | null;
  try {
    streamUrl = await resolveStreamUrl(
      videoId,
      itagParam ? Number(itagParam) : Number.NaN
    );
  } catch (error) {
    console.error("[youtube-trimmer] proxy resolve failed", error);
    return jsonError("Could not resolve the video stream", 502);
  }
  if (!streamUrl) {
    return jsonError("This video's stream is no longer available", 404);
  }

  // Forward the client's Range header so <video> seeking works and we never
  // buffer the whole file in the Worker.
  const range = request.headers.get("range");
  const upstream = await fetch(streamUrl, {
    headers: range ? { Range: range } : {},
  });

  if (!upstream.ok && upstream.status !== 206) {
    return jsonError(`Upstream returned ${upstream.status}`, 502);
  }

  const headers = new Headers(CORS_HEADERS);
  for (const name of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
  ]) {
    const value = upstream.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  headers.set("Cache-Control", "no-store");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
