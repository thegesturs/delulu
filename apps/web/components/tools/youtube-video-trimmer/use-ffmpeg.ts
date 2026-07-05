"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Single-threaded ffmpeg.wasm wrapper for the video trimmer.
 *
 * ffmpeg.wasm is loaded from jsDelivr at runtime (UMD build + globals) rather
 * than imported through the bundler, because `@ffmpeg/ffmpeg` spawns its worker
 * via `new Worker(new URL(...))`, which neither Turbopack nor webpack can
 * statically resolve. Loading the UMD build sidesteps bundling entirely and works
 * identically in dev, production, and on Cloudflare Workers.
 *
 * The core (~32MB) is also fetched from the CDN via `toBlobURL` (Cloudflare
 * Workers static assets have a 25 MiB per-file limit, so it can't live in
 * `public/`). `toBlobURL` produces a same-origin `blob:` URL, so no COOP/COEP
 * cross-origin-isolation headers are needed.
 */

const CORE_VERSION = "0.12.10";
const CDN = "https://cdn.jsdelivr.net/npm";

interface FFmpegLike {
  on: (event: "progress", cb: (e: { progress: number }) => void) => void;
  load: (opts: {
    coreURL: string;
    wasmURL: string;
    classWorkerURL?: string;
  }) => Promise<boolean>;
  writeFile: (name: string, data: Uint8Array) => Promise<boolean>;
  exec: (args: string[]) => Promise<number>;
  readFile: (name: string) => Promise<Uint8Array | string>;
  deleteFile: (name: string) => Promise<boolean>;
}

declare global {
  interface Window {
    FFmpegWASM?: { FFmpeg: new () => FFmpegLike };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

// @ffmpeg/util's toBlobURL/fetchFile are trivial; implementing them inline avoids
// depending on the util UMD global (which doesn't reliably attach to window).
async function toBlobURL(url: string, mimeType: string): Promise<string> {
  const buf = await (await fetch(url)).arrayBuffer();
  return URL.createObjectURL(new Blob([buf], { type: mimeType }));
}

async function fetchFile(input: File | string | Blob): Promise<Uint8Array> {
  if (typeof input === "string") {
    const buf = await (await fetch(input)).arrayBuffer();
    return new Uint8Array(buf);
  }
  return new Uint8Array(await input.arrayBuffer());
}

export interface TrimOptions {
  /** Uploaded File, or a URL string (e.g. the YouTube proxy endpoint). */
  source: File | string;
  startSec: number;
  endSec: number;
  /** Re-encode for frame-accurate cuts (slower). Default = stream copy. */
  reencode?: boolean;
}

type LoadState = "idle" | "loading" | "ready" | "error";

export function useFfmpeg() {
  const ffmpegRef = useRef<FFmpegLike | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  /** 0..1 during processing, or -1 for indeterminate (download/copy). */
  const [progress, setProgress] = useState(-1);

  const load = useCallback(async () => {
    if (ffmpegRef.current) {
      return ffmpegRef.current;
    }
    setLoadState("loading");
    try {
      // ffmpeg.js + its worker chunk (814.ffmpeg.js) are self-hosted same-origin
      // so the ffmpeg Worker can be constructed (browsers block cross-origin
      // workers). They're tiny (~7KB total). Only the 32MB core is pulled from the
      // CDN as a blob (too big for Cloudflare's 25 MiB static-asset limit).
      await loadScript("/ffmpeg/ffmpeg.js");

      const FFmpegCtor = window.FFmpegWASM?.FFmpeg;
      if (!FFmpegCtor) {
        throw new Error("ffmpeg failed to initialise");
      }

      const ffmpeg = new FFmpegCtor();
      ffmpeg.on("progress", ({ progress: p }) => {
        setProgress(Math.min(Math.max(p, 0), 1));
      });
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${CDN}/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`,
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          `${CDN}/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.wasm`,
          "application/wasm"
        ),
      });

      ffmpegRef.current = ffmpeg;
      setLoadState("ready");
      return ffmpeg;
    } catch (error) {
      setLoadState("error");
      throw error;
    }
  }, []);

  const trim = useCallback(
    async ({
      source,
      startSec,
      endSec,
      reencode,
    }: TrimOptions): Promise<Blob> => {
      const ffmpeg = await load();

      const inputName = "input.mp4";
      const outputName = "output.mp4";
      setProgress(-1);
      await ffmpeg.writeFile(inputName, await fetchFile(source));

      const duration = Math.max(endSec - startSec, 0.1);
      const args = reencode
        ? [
            "-ss",
            String(startSec),
            "-i",
            inputName,
            "-t",
            String(duration),
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-c:a",
            "aac",
            outputName,
          ]
        : [
            "-ss",
            String(startSec),
            "-i",
            inputName,
            "-t",
            String(duration),
            "-c",
            "copy",
            outputName,
          ];

      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(outputName);

      // Free wasm memory so repeated trims don't accumulate.
      await ffmpeg.deleteFile(inputName).catch(() => {
        // Ignore cleanup failures; the next ffmpeg instance starts from a fresh FS.
      });
      await ffmpeg.deleteFile(outputName).catch(() => {
        // Ignore cleanup failures; the trim has already completed successfully.
      });
      setProgress(-1);

      const bytes = data as Uint8Array;
      return new Blob([bytes], { type: "video/mp4" });
    },
    [load]
  );

  return { load, trim, loadState, progress };
}
