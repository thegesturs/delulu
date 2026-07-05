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

// ffmpeg.wasm loads the whole input into wasm memory, so cap input size to keep
// browser tabs from OOMing.
const MAX_INPUT_BYTES = 400 * 1024 * 1024; // 400 MB
const NUMERIC_SEGMENT_RE = /^\d+$/;
const FILE_EXTENSION_RE = /\.[^.]+$/;

type Phase = "input" | "loaded" | "processing" | "done";

interface ResolvedVideo {
  videoId: string;
  title: string;
  durationSec: number;
  thumbnail: string | null;
  formats: Array<{
    itag: number;
    qualityLabel: string;
    approxSizeBytes: number | null;
    height: number | null;
  }>;
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
    const next = {
      ...draft,
      [part]: rawValue,
    };
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
  const { trim, loadState, progress } = useFfmpeg();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [phase, setPhase] = useState<Phase>("input");
  const [urlValue, setUrlValue] = useState("");
  const [resolving, setResolving] = useState(false);

  // Loaded video state
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [trimSource, setTrimSource] = useState<File | string | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [reencode, setReencode] = useState(false);

  // Result state
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const resetAll = useCallback(() => {
    if (videoSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(videoSrc);
    }
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }
    setPhase("input");
    setVideoSrc(null);
    setTrimSource(null);
    setTitle("");
    setDuration(0);
    setRange([0, 0]);
    setResultUrl(null);
    setUrlValue("");
  }, [videoSrc, resultUrl]);

  const onLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
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
    const objectUrl = URL.createObjectURL(file);
    setVideoSrc(objectUrl);
    setTrimSource(file);
    setTitle(file.name.replace(FILE_EXTENSION_RE, ""));
    setRange([0, 0]);
    setDuration(0);
    setPhase("loaded");
  }, []);

  const handleResolveUrl = useCallback(async () => {
    if (!urlValue.trim()) {
      return;
    }
    setResolving(true);
    try {
      const res = await fetch(
        `/api/tools/youtube?mode=resolve&url=${encodeURIComponent(urlValue.trim())}`
      );
      const data = (await res.json()) as ResolvedVideo & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not load that video.");
      }
      const best = data.formats[0];
      if (!best) {
        throw new Error("No downloadable format found for this video.");
      }
      if (best.approxSizeBytes && best.approxSizeBytes > MAX_INPUT_BYTES) {
        toast.warning(
          "This video is large — trimming may be slow or run out of memory."
        );
      }
      const proxyUrl = `/api/tools/youtube?mode=proxy&id=${data.videoId}&itag=${best.itag}`;
      setVideoSrc(proxyUrl);
      setTrimSource(proxyUrl);
      setTitle(data.title);
      setDuration(data.durationSec);
      setRange([0, data.durationSec]);
      setPhase("loaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setResolving(false);
    }
  }, [urlValue]);

  const handleTrim = useCallback(async () => {
    if (!trimSource) {
      return;
    }
    const [start, end] = range;
    if (end - start < 0.1) {
      toast.error("Pick a start and end point first.");
      return;
    }
    setPhase("processing");
    try {
      const blob = await trim({
        source: trimSource,
        startSec: start,
        endSec: end,
        reencode,
      });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setPhase("done");
    } catch (error) {
      console.error(error);
      toast.error(
        "Couldn't trim that video. Try the frame-accurate toggle or a different file."
      );
      setPhase("loaded");
    }
  }, [trimSource, range, reencode, trim]);

  const setStartToCurrent = () => {
    const el = videoRef.current;
    if (el) {
      setRange(([, end]) => [clamp(el.currentTime, 0, end - 0.1), end]);
    }
  };
  const setEndToCurrent = () => {
    const el = videoRef.current;
    if (el) {
      setRange(([start]) => [
        start,
        clamp(el.currentTime, start + 0.1, duration),
      ]);
    }
  };

  const clipLength = range[1] - range[0];

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
                      handleResolveUrl();
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={urlValue}
                />
                <Button
                  className="shrink-0"
                  disabled={resolving || !urlValue.trim()}
                  onClick={handleResolveUrl}
                >
                  {resolving ? (
                    <>
                      <Loader2 className="mr-1.5 size-4 animate-spin" />{" "}
                      Loading…
                    </>
                  ) : (
                    "Load video"
                  )}
                </Button>
              </div>
              <p className="mt-3 text-muted-foreground text-xs">
                Paste any YouTube link. The video is fetched, then trimmed
                entirely in your browser — nothing is uploaded to our servers.
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

        {(phase === "loaded" || phase === "processing" || phase === "done") &&
          videoSrc && (
            <div className="flex flex-col gap-5">
              <div className="overflow-hidden rounded-lg border bg-black">
                {/* biome-ignore lint/a11y/useMediaCaption: user-provided media, no captions available */}
                <video
                  className="mx-auto max-h-[420px] w-full"
                  controls
                  onLoadedMetadata={onLoadedMetadata}
                  playsInline
                  ref={videoRef}
                  src={videoSrc}
                />
              </div>

              <p
                className="truncate text-center font-medium text-sm"
                title={title}
              >
                {title}
              </p>

              {duration > 0 && phase !== "done" && (
                <div className="flex flex-col gap-4">
                  <Slider
                    max={duration}
                    min={0}
                    onValueChange={(v) => {
                      const next = [v[0], v[1]] as [number, number];
                      setRange(next);
                      if (videoRef.current) {
                        videoRef.current.currentTime = next[0];
                      }
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
                      onChange={(seconds) => {
                        setRange(([, end]) => [
                          clamp(seconds, 0, end - 0.1),
                          end,
                        ]);
                      }}
                      onSetCurrent={setStartToCurrent}
                      value={range[0]}
                    />
                    <TimePartsInput
                      idPrefix="end-time"
                      label="End"
                      maxSeconds={duration}
                      minSeconds={Math.min(range[0] + 0.1, duration)}
                      onChange={(seconds) => {
                        setRange(([start]) => [
                          start,
                          clamp(seconds, start + 0.1, duration),
                        ]);
                      }}
                      onSetCurrent={setEndToCurrent}
                      value={range[1]}
                    />
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span>Clip length: {formatTime(clipLength)}</span>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        checked={reencode}
                        onChange={(e) => setReencode(e.target.checked)}
                        type="checkbox"
                      />
                      Frame-accurate (slower, re-encodes)
                    </label>
                  </div>
                </div>
              )}

              {phase === "processing" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    {loadState === "loading"
                      ? "Loading the trimmer engine…"
                      : "Trimming your clip…"}
                  </div>
                  <Progress
                    value={progress >= 0 ? progress * 100 : undefined}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                {phase === "loaded" && (
                  <Button onClick={handleTrim} size="lg">
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
                  onClick={
                    phase === "done" ? () => setPhase("loaded") : resetAll
                  }
                  variant="outline"
                >
                  <RotateCcw className="mr-1.5 size-4" />
                  {phase === "done" ? "Trim again" : "Start over"}
                </Button>
              </div>

              {phase === "done" && (
                <p className="text-center text-muted-foreground text-xs">
                  Tip: stream-copy cuts snap to the nearest keyframe. For an
                  exact cut, enable “Frame-accurate” and trim again.
                </p>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
}
