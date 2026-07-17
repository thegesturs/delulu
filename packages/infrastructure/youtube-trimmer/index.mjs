/**
 * YouTube trimmer Lambda (container image).
 *
 * POST { url, start, end, maxHeight? } → streams back a trimmed MP4.
 *
 * yt-dlp does the heavy lifting: `--download-sections` fetches ONLY the requested
 * seconds (not the whole video), picks a playable format across clients, handles
 * ciphers, and muxes video+audio to MP4. This is far more reliable than
 * youtubei.js on Cloudflare Workers, which can't run yt-dlp/ffmpeg or generate a
 * PoToken.
 *
 * Abuse controls: a shared secret header (set by the calling Next route), an
 * output-length cap, and Lambda reserved concurrency (configured in SST).
 */

import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const YOUTUBE_PATH_ID_RE = /\/(?:shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})/;
const WWW_RE = /^www\./;
const GATED_RE = /private|sign in|members-only|not available|unavailable/i;
const MAX_CLIP_SECONDS = Number(process.env.MAX_CLIP_SECONDS || 600); // 10 min
const DEFAULT_MAX_HEIGHT = 720;
const YT_DLP = "/usr/local/bin/yt-dlp";
const FFMPEG = "/usr/local/bin/ffmpeg";

function extractVideoId(input) {
  const trimmed = String(input || "").trim();
  if (YOUTUBE_ID_RE.test(trimmed)) {
    return trimmed;
  }
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(WWW_RE, "");
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

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Trim-Secret",
    ...extra,
  };
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(YT_DLP, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(stderr.trim().split("\n").at(-1) || `yt-dlp exit ${code}`)
        );
      }
    });
  });
}

async function handleTrim(event, responseStream) {
  const sendJson = (statusCode, obj) => {
    const s = globalThis.awslambda.HttpResponseStream.from(responseStream, {
      statusCode,
      headers: corsHeaders({ "Content-Type": "application/json" }),
    });
    s.write(JSON.stringify(obj));
    s.end();
  };

  const method = event.requestContext?.http?.method;
  if (method === "OPTIONS") {
    const s = globalThis.awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 204,
      headers: corsHeaders(),
    });
    s.end();
    return;
  }
  if (method !== "POST") {
    return sendJson(405, { error: "Method not allowed" });
  }

  // Shared-secret auth so the public Function URL can't be abused directly.
  const secret = process.env.TRIM_SECRET;
  if (secret) {
    const provided =
      event.headers?.["x-trim-secret"] ?? event.headers?.["X-Trim-Secret"];
    if (provided !== secret) {
      return sendJson(401, { error: "Unauthorized" });
    }
  }

  let body;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || "{}";
    body = JSON.parse(raw);
  } catch {
    return sendJson(400, { error: "Invalid JSON body" });
  }

  const videoId = extractVideoId(body.url);
  if (!videoId) {
    return sendJson(400, {
      error: "Could not find a YouTube video id in that URL",
    });
  }
  const start = Number(body.start);
  const end = Number(body.end);
  if (
    !(Number.isFinite(start) && Number.isFinite(end)) ||
    end <= start ||
    start < 0
  ) {
    return sendJson(400, { error: "Invalid start/end times" });
  }
  if (end - start > MAX_CLIP_SECONDS) {
    return sendJson(400, {
      error: `Clip too long — max ${Math.floor(MAX_CLIP_SECONDS / 60)} minutes per trim.`,
    });
  }
  const maxHeight = Math.min(
    Math.max(Number(body.maxHeight) || DEFAULT_MAX_HEIGHT, 144),
    1080
  );

  const dir = await mkdtemp(join(tmpdir(), "trim-"));
  const out = join(dir, "clip.mp4");
  try {
    const args = [
      `https://www.youtube.com/watch?v=${videoId}`,
      "--download-sections",
      `*${start}-${end}`,
      "--force-keyframes-at-cuts",
      "-f",
      `bv*[height<=${maxHeight}][ext=mp4]+ba[ext=m4a]/b[height<=${maxHeight}][ext=mp4]/b[height<=${maxHeight}]/b`,
      "--merge-output-format",
      "mp4",
      "--no-playlist",
      "--no-warnings",
      "--no-progress",
      "--ffmpeg-location",
      FFMPEG,
      "--socket-timeout",
      "20",
      ...(process.env.YT_COOKIES_FILE
        ? ["--cookies", process.env.YT_COOKIES_FILE]
        : []),
      "-o",
      out,
    ];
    await runYtDlp(args);
    const info = await stat(out);

    const download = globalThis.awslambda.HttpResponseStream.from(
      responseStream,
      {
        statusCode: 200,
        headers: corsHeaders({
          "Content-Type": "video/mp4",
          "Content-Length": String(info.size),
          "Content-Disposition": 'attachment; filename="clip.mp4"',
          "Cache-Control": "no-store",
        }),
      }
    );
    await pipeline(createReadStream(out), download);
  } catch (err) {
    const message = String(err?.message || err);
    const gated = GATED_RE.test(message);
    return sendJson(gated ? 422 : 502, {
      error: gated
        ? "This video can't be downloaded (private, members-only, or unavailable). Try another, or use Upload."
        : "Could not fetch or trim this video. Try again, or use the Upload tab.",
    });
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {
      // best-effort temp cleanup
    });
  }
}

export const handler = globalThis.awslambda.streamifyResponse(handleTrim);
