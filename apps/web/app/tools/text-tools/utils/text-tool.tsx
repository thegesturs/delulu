"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Card } from "@delulu/design-system/components/ui/card";
import { DottedSeparator } from "@delulu/design-system/components/ui/dotted-separator";
import { Progress } from "@delulu/design-system/components/ui/progress";
import { Textarea } from "@delulu/design-system/components/ui/textarea";
import { cn } from "@delulu/design-system/lib/utils";
import { ArrowUpRight, Clipboard, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import {
  analyzeText,
  getTextToolUiCopy,
  type TextToolDefinition,
  transformText,
} from "./text-tools";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://solulu.delulu.social";

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the selection-based browser fallback.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
};

export function TextTool({ tool }: { tool: TextToolDefinition }) {
  const ui = getTextToolUiCopy(tool.slug);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const result = useMemo(
    () => transformText(text, tool.mode),
    [text, tool.mode]
  );
  const analysis = useMemo(() => analyzeText(result), [result]);
  const remaining =
    tool.limit === undefined ? undefined : tool.limit - analysis.characters;
  const overLimit = remaining !== undefined && remaining < 0;
  const progress = tool.limit
    ? Math.min(100, (analysis.characters / tool.limit) * 100)
    : 0;
  const outputVisible = tool.mode !== "count";

  const handleCopy = async () => {
    if (!result) {
      return;
    }
    const copied = await copyText(result);
    setNotice(
      copied
        ? { message: "Copied to clipboard.", error: false }
        : {
            message:
              "Couldn’t copy automatically. Select the text and copy it manually.",
            error: true,
          }
    );
  };

  const handleComposer = async () => {
    if (!result) {
      return;
    }
    const composerWindow = window.open(`${APP_URL}/post`, "_blank");
    if (composerWindow) {
      composerWindow.opener = null;
    }
    const copied = await copyText(result);
    if (!composerWindow) {
      window.location.assign(`${APP_URL}/post`);
      return;
    }
    setNotice(
      copied
        ? {
            message: "Copied. Your new Delulu post is open in another tab.",
            error: false,
          }
        : {
            message:
              "Your new Delulu post is open. Select and copy the text manually before pasting it.",
            error: true,
          }
    );
  };

  return (
    <div className="-mx-4">
      <DottedSeparator />
      <div className="px-4 py-6">
        <Card className="mx-auto max-w-4xl overflow-hidden border-primary/20 shadow-sm">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="p-4 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <label
                  className="font-semibold text-sm"
                  htmlFor="text-tool-input"
                >
                  {ui.inputLabel}
                </label>
                <Button
                  onClick={() => {
                    setText(tool.example);
                    setNotice({
                      message:
                        "Example loaded. Replace it with your own words.",
                      error: false,
                    });
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Sparkles /> {ui.exampleAction}
                </Button>
              </div>
              <Textarea
                aria-describedby="text-tool-status"
                className="min-h-52 resize-y text-base leading-7"
                id="text-tool-input"
                onChange={(event) => {
                  setText(event.target.value);
                  setNotice(null);
                }}
                placeholder={tool.placeholder}
                spellCheck
                value={text}
              />

              {outputVisible ? (
                <div className="mt-5">
                  <label
                    className="mb-3 block font-semibold text-sm"
                    htmlFor="text-tool-output"
                  >
                    {ui.outputLabel ?? "Copy-ready text"}
                  </label>
                  <Textarea
                    className="min-h-40 resize-y bg-muted/30 text-base leading-7"
                    id="text-tool-output"
                    placeholder={`Your ${(
                      ui.outputLabel ?? "copy-ready text"
                    ).toLowerCase()} will appear here as you type.`}
                    readOnly
                    value={result}
                  />
                  <span aria-live="polite" className="sr-only">
                    {result
                      ? `${ui.outputLabel ?? "Copy-ready text"} updated.`
                      : ""}
                  </span>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button disabled={!result} onClick={handleCopy} type="button">
                  <Clipboard /> {ui.copyAction}
                </Button>
                <Button
                  disabled={!text}
                  onClick={() => {
                    setText("");
                    setNotice({ message: "Draft cleared.", error: false });
                  }}
                  type="button"
                  variant="outline"
                >
                  <RotateCcw /> Clear
                </Button>
                {tool.composerHandoff ? (
                  <Button
                    disabled={!result}
                    onClick={handleComposer}
                    type="button"
                    variant="secondary"
                  >
                    Create this post in Delulu <ArrowUpRight />
                  </Button>
                ) : null}
              </div>
              <p
                aria-live="polite"
                className={cn(
                  "mt-3 min-h-5 text-muted-foreground text-sm",
                  notice?.error && "text-destructive"
                )}
              >
                {notice?.message}
              </p>
            </div>

            <aside className="border-border border-t bg-muted/20 p-4 sm:p-6 lg:border-t-0 lg:border-l">
              <h2 className="font-semibold text-sm">Your counts</h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1">
                {[
                  ["Characters", analysis.characters],
                  ["Words", analysis.words],
                  ["Hashtags", analysis.hashtags],
                  ["Mentions", analysis.mentions],
                  ["Lines", analysis.lines],
                ].map(([label, value]) => (
                  <div
                    className="rounded-lg border bg-background px-3 py-2"
                    key={label}
                  >
                    <dt className="text-muted-foreground text-xs">{label}</dt>
                    <dd className="mt-0.5 font-bold text-xl tabular-nums">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              {tool.limit ? (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                    <span>{tool.limitLabel}</span>
                    <strong
                      className={cn(
                        "tabular-nums",
                        overLimit && "text-destructive"
                      )}
                    >
                      {overLimit
                        ? `${Math.abs(remaining ?? 0).toLocaleString()} over`
                        : `${(remaining ?? 0).toLocaleString()} left`}
                    </strong>
                  </div>
                  <Progress
                    aria-label={`${analysis.characters.toLocaleString()} of ${tool.limit.toLocaleString()} characters used`}
                    aria-valuemax={tool.limit}
                    aria-valuemin={0}
                    aria-valuenow={Math.min(analysis.characters, tool.limit)}
                    className={cn(
                      overLimit &&
                        "[&_[data-slot=progress-indicator]]:bg-destructive"
                    )}
                    value={progress}
                  />
                  <output
                    aria-live="polite"
                    className={cn(
                      "mt-2 text-muted-foreground text-xs",
                      overLimit && "text-destructive"
                    )}
                    id="text-tool-status"
                  >
                    {overLimit
                      ? `Over the limit by ${Math.abs(remaining ?? 0).toLocaleString()} characters.`
                      : `${analysis.characters.toLocaleString()} of ${tool.limit.toLocaleString()} characters used.`}
                  </output>
                </div>
              ) : (
                <p
                  className="mt-5 text-muted-foreground text-xs"
                  id="text-tool-status"
                >
                  No platform character limit is applied here.
                </p>
              )}

              <p className="mt-5 text-muted-foreground text-xs leading-5">
                Your text stays in this browser tab.
              </p>
            </aside>
          </div>
        </Card>
      </div>
      <DottedSeparator />
    </div>
  );
}
