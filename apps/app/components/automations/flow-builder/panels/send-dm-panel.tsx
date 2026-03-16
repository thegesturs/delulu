"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Label } from "@delulu/design-system/components/ui/label";
import { Separator } from "@delulu/design-system/components/ui/separator";
import { Textarea } from "@delulu/design-system/components/ui/textarea";
import { Icon } from "@delulu/design-system/providers/icon";
import {
  Cancel01Icon,
  Loading03Icon,
  Upload04Icon,
} from "@hugeicons-pro/core-solid-rounded";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadSingleFile } from "@/hooks/use-upload-media";
import type { DmButton, SendDmStep } from "../utils/flow-types";
import { AudioRecorder } from "./audio-recorder";
import { ButtonEditor } from "./button-editor";

const VARIABLES = [
  { name: "{username}", description: "Commenter's Instagram username" },
  { name: "{comment_text}", description: "Full text of the comment" },
];

interface SendDmPanelProps {
  step: SendDmStep;
  isFreePlan?: boolean;
  onChange: (step: SendDmStep) => void;
  onCreateStepForButton?: (
    buttonIndex: number,
    stepType: "send_dm" | "condition"
  ) => void;
  onRemoveStepForButton?: (buttonIndex: number) => void;
}

function renderPreview(template: string): string {
  return (template || "")
    .replace(/{username}/g, "john_doe")
    .replace(/{comment_text}/g, "Great post!");
}

export function SendDmPanel({
  step,
  isFreePlan,
  onChange,
  onCreateStepForButton,
  onRemoveStepForButton,
}: SendDmPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertVariable = (variable: string) => {
    onChange({
      ...step,
      messageTemplate: step.messageTemplate + variable,
    });
  };

  const handleAudioUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const result = await uploadSingleFile(file);
        onChange({ ...step, voiceNoteUrl: result.url });
      } catch {
        toast.error("Failed to upload audio");
      } finally {
        setIsUploading(false);
      }
    },
    [step, onChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }
      if (!file.type.startsWith("audio/")) {
        toast.error("Please select an audio file");
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error("Audio file must be under 25MB");
        return;
      }
      handleAudioUpload(file);
      e.target.value = "";
    },
    [handleAudioUpload]
  );

  const previewText = renderPreview(step.messageTemplate);
  // All buttons render as template buttons (postback + URL), max 3
  const allButtons = (step.buttons ?? []).slice(0, 3);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="font-semibold text-sm">Send DM</h3>
        <p className="text-muted-foreground text-xs">
          Configure the direct message sent to the commenter.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Variables</Label>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((variable) => (
            <Button
              className="text-xs"
              key={variable.name}
              onClick={() => insertVariable(variable.name)}
              size="sm"
              variant="outline"
            >
              {variable.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Message Template</Label>
        <Textarea
          className="font-mono text-sm"
          onChange={(e) =>
            onChange({ ...step, messageTemplate: e.target.value })
          }
          placeholder="Enter the message to send..."
          rows={5}
          value={step.messageTemplate}
        />
      </div>

      {/* Voice Note */}
      <div className="space-y-2">
        <Label>Voice Note</Label>
        {step.voiceNoteUrl ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-2">
            {/* biome-ignore lint/a11y/useMediaCaption: voice note DM preview, no captions needed */}
            <audio
              className="h-8 flex-1"
              controls
              preload="metadata"
              src={step.voiceNoteUrl}
            />
            <Button
              className="shrink-0"
              onClick={() => onChange({ ...step, voiceNoteUrl: undefined })}
              size="icon"
              variant="ghost"
            >
              <Icon icon={Cancel01Icon} size={14} />
            </Button>
          </div>
        ) : isUploading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Icon className="animate-spin" icon={Loading03Icon} size={14} />
            Uploading...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              accept="audio/*"
              className="hidden"
              onChange={handleFileSelect}
              ref={fileInputRef}
              type="file"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="outline"
            >
              <Icon className="mr-1" icon={Upload04Icon} size={14} />
              Upload Audio
            </Button>
            <AudioRecorder onRecordingComplete={handleAudioUpload} />
          </div>
        )}
        <p className="text-muted-foreground text-xs">
          Sent as audio message before the text. Max 60s for recordings.
        </p>
      </div>

      {/* Instagram DM Preview */}
      <div className="space-y-2">
        <Label>Preview</Label>
        <div className="overflow-hidden rounded-xl border border-border bg-neutral-100 dark:bg-neutral-900">
          {/* Chat area */}
          <div className="flex min-h-[100px] flex-col justify-end gap-1 px-3 py-3">
            {step.voiceNoteUrl && (
              <div className="flex items-end gap-1.5">
                <div className="mb-0.5 h-6 w-6 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                <div className="rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-sm dark:bg-neutral-800">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15">
                      <span className="text-blue-500 text-xs">🎵</span>
                    </div>
                    <div className="h-1 w-24 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    <span className="text-[10px] text-neutral-400">0:00</span>
                  </div>
                </div>
              </div>
            )}
            {previewText ? (
              <>
                {/* Message bubble + buttons as one card */}
                <div className="flex items-end gap-1.5">
                  {/* Avatar */}
                  <div className="mb-0.5 h-6 w-6 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                  <div className="min-w-0 max-w-[85%]">
                    <div
                      className={`rounded-2xl rounded-bl-md bg-white px-3 py-2.5 shadow-sm dark:bg-neutral-800 ${
                        allButtons.length > 0 ? "rounded-b-md" : ""
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-neutral-900 text-sm leading-relaxed dark:text-neutral-100">
                        {previewText}
                      </p>
                      {isFreePlan && (
                        <p className="mt-2 border-neutral-200 border-t pt-2 text-[10px] text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
                          - - -<br />
                          Sent via @delulu.social
                        </p>
                      )}
                      {allButtons.length > 0 && (
                        <div className="mt-2 grid grid-cols-1 gap-1">
                          {allButtons.map((btn, i) => (
                            <span
                              className="flex items-center justify-center rounded-md border-neutral-200 bg-zinc-200 px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-600"
                              key={`btn-${btn.title}-${i}`}
                            >
                              {btn.title || "Button"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : step.voiceNoteUrl ? null : (
              <p className="text-center text-neutral-400 text-xs">
                Enter a message above to see the preview
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <ButtonEditor
        buttons={step.buttons ?? []}
        onChange={(buttons: DmButton[]) => onChange({ ...step, buttons })}
        onCreateStepForButton={onCreateStepForButton}
        onRemoveStepForButton={onRemoveStepForButton}
      />
    </div>
  );
}
