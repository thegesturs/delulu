"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Card, CardContent } from "@delulu/design-system/components/ui/card";
import { Input } from "@delulu/design-system/components/ui/input";
import { Label } from "@delulu/design-system/components/ui/label";
import { Progress } from "@delulu/design-system/components/ui/progress";
import { Slider } from "@delulu/design-system/components/ui/slider";
import { Toaster } from "@delulu/design-system/components/ui/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@delulu/design-system/components/ui/tabs";
import { cn } from "@delulu/design-system/lib/utils";
import {
  Download,
  Film,
  Loader2,
  RotateCcw,
  Scissors,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useFfmpeg } from "./use-ffmpeg";
import { useYouTubePlayer } from "./use-youtube-player";

// ffmpeg.wasm (Upload path) loads the whole input into wasm memory, so cap size.
const MAX_INPUT_BYTES = 400 * 1024 * 1024; // 400 MB
const NUMERIC_SEGMENT_RE = /^\d+$/;
const FILE_EXTENSION_RE = /\.[^.]+$/;
const YOUTUBE_ID_RE = /^[\w-]{11}$/;
const YOUTUBE_PATH_ID_RE = /\/(?:shorts|embed|live|v)\/([\w-]{11})/;
const WWW_RE = /^www\./;

type Phase = "input" | "loaded" | "processing" | "done";
type SourceKind = "youtube" | "upload";

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
  const host = parsed.hostname.replace(WWW_RE, "");
  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }
  if (host.endsWith("youtube.com")) {
    const v = parsed.searchParams.get("v");
    if (v && YOUTUBE_ID_RE.test(v)) {
      return v;
    }
    const m = parsed.pathname.match(YOUTUBE_PATH_ID_RE);
    return m ? m[1] : null;
  }
  return null;
}

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds % 60));
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getTimeParts(totalSeconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(totalSeconds));
  return {
    hours: Math.floor(wholeSeconds / 3600),
    minutes: Math.floor((wholeSeconds / 60) % 60),
    seconds: wholeSeconds % 60,
  };
}

function getTimeDraft(totalSeconds: number) {
  const parts = getTimeParts(totalSeconds);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    hours: pad(parts.hours),
    minutes: pad(parts.minutes),
    seconds: pad(parts.seconds),
  };
}

interface TimePartsInputProps {
  idPrefix: string;
  label: string;
  maxSeconds: number;
  minSeconds: number;
  onChange: (seconds: number) => void;
  onSetCurrent: () => void;
  value: number;
}

function TimePartsInput({
  idPrefix,
  label,
  maxSeconds,
  minSeconds,
  onChange,
  onSetCurrent,
  value,
}: TimePartsInputProps) {
  const showHours = maxSeconds >= 3600 || value >= 3600;
  const [draft, setDraft] = useState(() => getTimeDraft(value));
  const [editingPart, setEditingPart] = useState<keyof typeof draft | null>(
    null
  );

  useEffect(() => {
    if (!editingPart) {
      setDraft(getTimeDraft(value));
    }
  }, [editingPart, value]);

  const draftToSeconds = (nextDraft: typeof draft) =>
    Number(nextDraft.hours || 0) * 3600 +
    Number(nextDraft.minutes || 0) * 60 +
    Number(nextDraft.seconds || 0);

  const commit = useCallback(
    (nextDraft: typeof draft) => {
      onChange(clamp(draftToSeconds(nextDraft), minSeconds, maxSeconds));
    },
    [maxSeconds, minSeconds, onChange]
  );

  const updatePart = (part: keyof typeof draft, rawValue: string) => {
    if (rawValue !== "" && !NUMERIC_SEGMENT_RE.test(rawValue)) {
      return;
    }
    const next = { ...draft, [part]: rawValue };
    setDraft(next);
    commit(next);
  };

  const normalize = () => {
    setDraft(getTimeDraft(clamp(value, minSeconds, maxSeconds)));
    setEditingPart(null);
  };

  const renderSegment = (
    part: keyof typeof draft,
    shortLabel: string,
    maxLength = 2
  ) => (
    <div className="min-w-0 flex-1">
      <Label
        className="mb-1 block font-medium text-[10px] text-muted-foreground uppercase"
        htmlFor={`${idPrefix}-${part}`}
      >
        {shortLabel}
      </Label>
      <Input
        aria-label={`${label} ${shortLabel}`}
        autoComplete="off"
        className="h-11 px-2 text-center text-base tabular-nums"
        data-1p-ignore
        data-lpignore="true"
        id={`${idPrefix}-${part}`}
        inputMode="numeric"
        maxLength={maxLength}
        onBlur={normalize}
        onChange={(e) => updatePart(part, e.target.value)}
        onFocus={() => setEditingPart(part)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        pattern="[0-9]*"
        value={draft[part]}
      />
    </div>
  );

  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Label
          className="font-semibold text-sm"
          htmlFor={`${idPrefix}-${showHours ? "hours" : "minutes"}`}
        >
          {label}
        </Label>
        <Button
          className="h-7 shrink-0 px-2.5 text-xs"
          onClick={onSetCurrent}
          size="sm"
          type="button"
          variant="outline"
        >
          Set current
        </Button>
      </div>
      <div className="flex items-end gap-2">
        {showHours && renderSegment("hours", "hr", 3)}
        {renderSegment("minutes", "min")}
        {renderSegment("seconds", "sec")}
      </div>
    </div>
  );
}

export function VideoTrimmer() {
  const ffmpeg = useFfmpeg();
  const ytPlayer = useYouTubePlayer();
  const uploadVideoRef = useRef<HTMLVideoElement>(null);

  const [phase, setPhase] = useState<Phase>("input");
  const [sourceKind, setSourceKind] = useState<SourceKind | null>(null);
  const [urlValue, setUrlValue] = useState("");

  // YouTube state
  const [videoId, setVideoId] = useState<string | null>(null);
  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("clip");
  const [duration, setDuration] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [reencode, setReencode] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Mount the YouTube player once we enter the loaded phase for a YT source.
  useEffect(() => {
    if (sourceKind === "youtube" && videoId && phase !== "input") {
      ytPlayer.load(videoId).catch(() => {
        // Player failures leave an empty preview; nothing to recover here.
      });
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: load is stable; only re-run on source change
  }, [sourceKind, videoId, phase]);

  // Pick up the duration once the YouTube player reports it.
  useEffect(() => {
    if (sourceKind === "youtube" && ytPlayer.duration > 0) {
      setDuration(ytPlayer.duration);
      setRange((prev) => (prev[1] === 0 ? [0, ytPlayer.duration] : prev));
    }
  }, [sourceKind, ytPlayer.duration]);

  const resetAll = useCallback(() => {
    if (uploadUrl) {
      URL.revokeObjectURL(uploadUrl);
    }
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
    ytPlayer.destroy();
    setPhase("input");
    setSourceKind(null);
    setVideoId(null);
    setUploadFile(null);
    setUploadUrl(null);
    setTitle("clip");
    setDuration(0);
    setRange([0, 0]);
    setResultUrl(null);
    setUrlValue("");
  }, [uploadUrl, resultUrl, ytPlayer]);

  const handleLoadYoutube = useCallback(() => {
    const id = extractVideoId(urlValue);
    if (!id) {
      toast.error("That doesn't look like a YouTube link.");
      return;
    }
    setSourceKind("youtube");
    setVideoId(id);
    setTitle("youtube-clip");
    setDuration(0);
    setRange([0, 0]);
    setPhase("loaded");
  }, [urlValue]);

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) {
      return;
    }
    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      toast.error(
        "That file is over 400MB — too large to trim in the browser."
      );
      return;
    }
    setSourceKind("upload");
    setUploadFile(file);
    setUploadUrl(URL.createObjectURL(file));
    setTitle(file.name.replace(FILE_EXTENSION_RE, ""));
    setRange([0, 0]);
    setDuration(0);
    setPhase("loaded");
  }, []);

  const onUploadMetadata = useCallback(() => {
    const el = uploadVideoRef.current;
    if (!el) {
      return;
    }
    const dur =
      Number.isFinite(el.duration) && el.duration > 0 ? el.duration : duration;
    if (dur > 0) {
      setDuration(dur);
      setRange((prev) => (prev[1] === 0 ? [0, dur] : prev));
    }
  }, [duration]);

  const trimYoutube = useCallback(
    async (start: number, end: number) => {
      const res = await fetch("/api/tools/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          start,
          end,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Couldn't trim that video.");
      }
      return res.blob();
    },
    [videoId]
  );

  const handleTrim = useCallback(async () => {
    const [start, end] = range;
    if (end - start < 0.1) {
      toast.error("Pick a start and end point first.");
      return;
    }
    ytPlayer.pause();
    setPhase("processing");
    try {
      const blob =
        sourceKind === "youtube"
          ? await trimYoutube(start, end)
          : await ffmpeg.trim({
              source: uploadFile as File,
              startSec: start,
              endSec: end,
              reencode,
            });
      setResultUrl(URL.createObjectURL(blob));
      setPhase("done");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong."
      );
      setPhase("loaded");
    }
  }, [range, sourceKind, uploadFile, reencode, trimYoutube, ffmpeg, ytPlayer]);

  const setStartToCurrent = () => {
    const t =
      sourceKind === "youtube"
        ? ytPlayer.getCurrentTime()
        : (uploadVideoRef.current?.currentTime ?? 0);
    setRange(([, end]) => [clamp(t, 0, end - 0.1), end]);
  };
  const setEndToCurrent = () => {
    const t =
      sourceKind === "youtube"
        ? ytPlayer.getCurrentTime()
        : (uploadVideoRef.current?.currentTime ?? 0);
    setRange(([start]) => [start, clamp(t, start + 0.1, duration)]);
  };

  const seekPreview = (seconds: number) => {
    if (sourceKind === "youtube") {
      ytPlayer.seekTo(seconds);
    } else if (uploadVideoRef.current) {
      uploadVideoRef.current.currentTime = seconds;
    }
  };

  const clipLength = range[1] - range[0];
  const showEditor =
    phase === "loaded" || phase === "processing" || phase === "done";

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <Toaster position="top-center" richColors />
      <CardContent className="p-4 sm:p-6">
        {phase === "input" && (
          <Tabs className="w-full" defaultValue="youtube">
            <TabsList className="mx-auto mb-6 grid w-full max-w-sm grid-cols-2">
              <TabsTrigger value="youtube">
                <Film className="mr-1.5 size-4" /> YouTube URL
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="mr-1.5 size-4" /> Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="youtube">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  onChange={(e) => setUrlValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleLoadYoutube();
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={urlValue}
                />
                <Button
                  className="shrink-0"
                  disabled={!urlValue.trim()}
                  onClick={handleLoadYoutube}
                >
                  Load video
                </Button>
              </div>
              <p className="mt-3 text-muted-foreground text-xs">
                Paste any YouTube link, pick your start and end on the player,
                then trim. We fetch and cut just that section for you.
              </p>
            </TabsContent>

            <TabsContent value="upload">
              {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: the label is the visible drop-zone for the hidden file input. */}
              <label
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center transition-colors hover:border-primary hover:bg-muted/40"
                )}
                htmlFor="video-file"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFile(e.dataTransfer.files?.[0]);
                }}
              >
                <Upload className="size-8 text-muted-foreground" />
                <span className="font-medium text-sm">
                  Drop a video here, or click to browse
                </span>
                <span className="text-muted-foreground text-xs">
                  MP4, WebM, MOV — up to 400MB. Never leaves your device.
                </span>
                <input
                  accept="video/*"
                  className="hidden"
                  id="video-file"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  type="file"
                />
              </label>
            </TabsContent>
          </Tabs>
        )}

        {showEditor && (
          <div className="flex flex-col gap-5">
            {/* Preview: YouTube embed OR uploaded <video> */}
            <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
              {sourceKind === "youtube" ? (
                <div className="h-full w-full" ref={ytPlayer.mountRef} />
              ) : (
                uploadUrl && (
                  // biome-ignore lint/a11y/useMediaCaption: user-provided media, no captions
                  <video
                    className="h-full w-full"
                    controls
                    onLoadedMetadata={onUploadMetadata}
                    playsInline
                    ref={uploadVideoRef}
                    src={uploadUrl}
                  />
                )
              )}
            </div>

            {duration > 0 && phase !== "done" && (
              <div className="flex flex-col gap-4">
                <Slider
                  max={duration}
                  min={0}
                  onValueChange={(v) => {
                    const next = [v[0], v[1]] as [number, number];
                    const movedEnd = next[1] !== range[1];
                    setRange(next);
                    seekPreview(movedEnd ? next[1] : next[0]);
                  }}
                  step={0.1}
                  value={range}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <TimePartsInput
                    idPrefix="start-time"
                    label="Start"
                    maxSeconds={Math.max(range[1] - 0.1, 0)}
                    minSeconds={0}
                    onChange={(seconds) =>
                      setRange(([, end]) => [clamp(seconds, 0, end - 0.1), end])
                    }
                    onSetCurrent={setStartToCurrent}
                    value={range[0]}
                  />
                  <TimePartsInput
                    idPrefix="end-time"
                    label="End"
                    maxSeconds={duration}
                    minSeconds={Math.min(range[0] + 0.1, duration)}
                    onChange={(seconds) =>
                      setRange(([start]) => [
                        start,
                        clamp(seconds, start + 0.1, duration),
                      ])
                    }
                    onSetCurrent={setEndToCurrent}
                    value={range[1]}
                  />
                </div>

                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span>Clip length: {formatTime(clipLength)}</span>
                  {sourceKind === "upload" && (
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        checked={reencode}
                        onChange={(e) => setReencode(e.target.checked)}
                        type="checkbox"
                      />
                      Frame-accurate (slower, re-encodes)
                    </label>
                  )}
                </div>
              </div>
            )}

            {phase === "loaded" && duration === 0 && (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
                <Loader2 className="size-4 animate-spin" /> Loading player…
              </div>
            )}

            {phase === "processing" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  {sourceKind === "youtube"
                    ? "Trimming your clip… (this can take up to a minute)"
                    : ffmpeg.loadState === "loading"
                      ? "Loading the trimmer engine…"
                      : "Trimming your clip…"}
                </div>
                {sourceKind === "upload" && (
                  <Progress
                    value={
                      ffmpeg.progress >= 0 ? ffmpeg.progress * 100 : undefined
                    }
                  />
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              {phase === "loaded" && (
                <Button
                  disabled={duration === 0}
                  onClick={handleTrim}
                  size="lg"
                >
                  <Scissors className="mr-1.5 size-4" /> Trim video
                </Button>
              )}
              {phase === "done" && resultUrl && (
                <Button asChild size="lg">
                  <a
                    download={`${title || "clip"}-trimmed.mp4`}
                    href={resultUrl}
                  >
                    <Download className="mr-1.5 size-4" /> Download clip
                  </a>
                </Button>
              )}
              <Button
                disabled={phase === "processing"}
                onClick={phase === "done" ? () => setPhase("loaded") : resetAll}
                variant="outline"
              >
                <RotateCcw className="mr-1.5 size-4" />
                {phase === "done" ? "Trim again" : "Start over"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
