"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Icon } from "@delulu/design-system/providers/icon";
import { Mic01Icon, StopIcon } from "@hugeicons-pro/core-solid-rounded";
import { useCallback, useEffect, useRef, useState } from "react";

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
  maxDuration?: number;
}

export function AudioRecorder({
  onRecordingComplete,
  maxDuration = 60,
}: AudioRecorderProps) {
  const [state, setState] = useState<"idle" | "recording">("idle");
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        cleanup();
        setState("idle");
        setElapsed(0);
        onRecordingComplete(file);
      };

      mediaRecorder.start();
      setState("recording");
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= maxDuration) {
            mediaRecorderRef.current?.stop();
            return prev + 1;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      cleanup();
      setState("idle");
    }
  }, [maxDuration, onRecordingComplete, cleanup]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (state === "recording") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
        </div>
        <span className="font-mono text-sm tabular-nums">
          {formatTime(elapsed)} / {formatTime(maxDuration)}
        </span>
        <Button onClick={stopRecording} size="sm" variant="destructive">
          <Icon className="mr-1" icon={StopIcon} size={14} />
          Stop
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={startRecording} size="sm" variant="outline">
      <Icon className="mr-1" icon={Mic01Icon} size={14} />
      Record
    </Button>
  );
}
