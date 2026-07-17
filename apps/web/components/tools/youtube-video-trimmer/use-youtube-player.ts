"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Thin wrapper around the YouTube IFrame Player API. We use the official embed
 * as the scrubber for YouTube URLs — it always loads (no download, no CORS), so
 * the user can find in/out points on the real player. The actual trim happens
 * server-side (yt-dlp on Lambda); this is preview-only.
 */

interface YTPlayer {
  getDuration(): number;
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  pauseVideo(): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, number>;
          events?: { onReady?: (e: { target: YTPlayer }) => void };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.YT?.Player) {
    return Promise.resolve();
  }
  apiPromise ??= new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (
      !document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });
  return apiPromise;
}

export function useYouTubePlayer() {
  // The div YT replaces with its iframe (kept inside a stable React wrapper).
  const mountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);

  const load = useCallback(async (videoId: string) => {
    setReady(false);
    setDuration(0);
    await loadYouTubeApi();
    if (!(mountRef.current && window.YT?.Player)) {
      return;
    }
    playerRef.current?.destroy();
    playerRef.current = new window.YT.Player(mountRef.current, {
      videoId,
      width: "100%",
      height: "100%",
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onReady: (e) => {
          setReady(true);
          setDuration(e.target.getDuration());
        },
      },
    });
  }, []);

  const destroy = useCallback(() => {
    playerRef.current?.destroy();
    playerRef.current = null;
    setReady(false);
    setDuration(0);
  }, []);

  const getCurrentTime = useCallback(
    () => playerRef.current?.getCurrentTime() ?? 0,
    []
  );
  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);

  // Clean up on unmount.
  useEffect(() => () => playerRef.current?.destroy(), []);

  return {
    mountRef,
    load,
    destroy,
    ready,
    duration,
    getCurrentTime,
    seekTo,
    pause,
  };
}
