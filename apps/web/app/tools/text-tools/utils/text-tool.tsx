"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Card } from "@delulu/design-system/components/ui/card";
import { Progress } from "@delulu/design-system/components/ui/progress";
import { Textarea } from "@delulu/design-system/components/ui/textarea";
import { cn } from "@delulu/design-system/lib/utils";
import { ArrowUpRight, Clipboard, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import {
  analyzeText,
  type TextToolDefinition,
  transformText,
} from "./text-tools";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://solulu.delulu.social";

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
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
  document.execCommand("copy");
  textarea.remove();
};

export function TextTool({ tool }: { tool: TextToolDefinition }) {
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
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
    await copyText(result);
    setNotice("Copied to clipboard");
  };

  const handleComposer = async () => {
    if (!result) {
      return;
    }
    window.open(`${APP_URL}/post`, "_blank", "noopener,noreferrer");
    await copyText(result);
    setNotice("Copied — paste it into your new Delulu post");
  };

  return (
    <Card className="mx-auto max-w-4xl overflow-hidden border-primary/20 shadow-lg shadow-primary/5">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label className="font-semibold text-sm" htmlFor="text-tool-input">
              {outputVisible ? "Your text" : "Write or paste text"}
            </label>
            <Button
              onClick={() => {
                setText(tool.example);
                setNotice("Example loaded");
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Sparkles /> Use example
            </Button>
          </div>
          <Textarea
            aria-describedby="text-tool-status"
            className="min-h-52 resize-y text-base leading-7"
            id="text-tool-input"
            onChange={(event) => {
              setText(event.target.value);
              setNotice("");
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
                Copy-ready result
              </label>
              <Textarea
                className="min-h-40 resize-y bg-muted/30 text-base leading-7"
                id="text-tool-output"
                readOnly
                value={result}
              />
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled={!result} onClick={handleCopy} type="button">
              <Clipboard /> {outputVisible ? "Copy result" : "Copy text"}
            </Button>
            <Button
              disabled={!text}
              onClick={() => {
                setText("");
                setNotice("Text reset");
              }}
              type="button"
              variant="outline"
            >
              <RotateCcw /> Reset
            </Button>
            {tool.composerHandoff ? (
              <Button
                disabled={!result}
                onClick={handleComposer}
                type="button"
                variant="secondary"
              >
                Create post in Delulu <ArrowUpRight />
              </Button>
            ) : null}
          </div>
          <p
            aria-live="polite"
            className="mt-3 min-h-5 text-muted-foreground text-sm"
          >
            {notice}
          </p>
        </div>

        <aside className="border-border border-t bg-muted/20 p-4 sm:p-6 lg:border-t-0 lg:border-l">
          <h2 className="font-semibold text-sm">Live text stats</h2>
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
              No fixed character limit is applied to this tool.
            </p>
          )}

          <p className="mt-5 text-muted-foreground text-xs leading-5">
            Private by design: your text stays in this browser tab.
          </p>
        </aside>
      </div>
    </Card>
  );
}
