"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Label } from "@delulu/design-system/components/ui/label";
import { Separator } from "@delulu/design-system/components/ui/separator";
import { Textarea } from "@delulu/design-system/components/ui/textarea";
import type { CommentReply, DmButton, SendDmStep } from "../utils/flow-types";
import { ButtonEditor } from "./button-editor";
import { CommentReplyEditor } from "./comment-reply-editor";

const VARIABLES = [
  { name: "{username}", description: "Commenter's Instagram username" },
  { name: "{comment_text}", description: "Full text of the comment" },
];

interface SendDmPanelProps {
  step: SendDmStep;
  isFreePlan?: boolean;
  onChange: (step: SendDmStep) => void;
}

function renderPreview(template: string): string {
  return (template || "")
    .replace(/{username}/g, "john_doe")
    .replace(/{comment_text}/g, "Great post!");
}

export function SendDmPanel({ step, isFreePlan, onChange }: SendDmPanelProps) {
  const insertVariable = (variable: string) => {
    onChange({
      ...step,
      messageTemplate: step.messageTemplate + variable,
    });
  };

  const previewText = renderPreview(step.messageTemplate);
  const quickReplies = (step.buttons ?? []).filter(
    (b) => b.type === "quick_reply"
  );
  const urlButtons = (step.buttons ?? []).filter((b) => b.type === "url");

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

      {/* Instagram DM Preview */}
      <div className="space-y-2">
        <Label>Preview</Label>
        <div className="overflow-hidden rounded-xl border border-border bg-neutral-100 dark:bg-neutral-900">
          {/* Chat area */}
          <div className="flex min-h-[100px] flex-col justify-end gap-1 px-3 py-3">
            {previewText ? (
              <>
                {/* Message bubble + URL buttons as one card */}
                <div className="flex items-end gap-1.5">
                  {/* Avatar */}
                  <div className="mb-0.5 h-6 w-6 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                  <div className="min-w-0 max-w-[85%]">
                    {/* Message bubble */}
                    <div
                      className={`rounded-2xl rounded-bl-md bg-white px-3 py-2.5 shadow-sm dark:bg-neutral-800 ${
                        urlButtons.length > 0 ? "rounded-b-md" : ""
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-neutral-900 text-xs leading-relaxed dark:text-neutral-100">
                        {previewText}
                      </p>
                      {isFreePlan && (
                        <p className="mt-2 border-neutral-200 border-t pt-2 text-[10px] text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
                          - - -<br />
                          Sent via @delulu.social
                        </p>
                      )}
                      {urlButtons.length > 0 && (
                        <div className="mt-2 grid grid-cols-1 gap-1">
                          {urlButtons.map((btn, i) => (
                            <a
                              className="flex items-center justify-center rounded-md border-neutral-200 bg-zinc-200 px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                              href={btn.url ?? ""}
                              key={i}
                              target="_blank"
                            >
                              {btn.title || "Button"}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {quickReplies.length > 0 && (
                    <div className="mt-1 flex flex-wrap justify-end gap-1.5 pl-8">
                      {quickReplies.map((btn, i) => (
                        <span
                          className="rounded-full border border-blue-500 bg-white px-2.5 py-1 text-[10px] text-blue-500 shadow-sm dark:bg-neutral-800 dark:text-blue-400"
                          key={i}
                        >
                          {btn.title || "Button"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Quick reply buttons — separate row, right-aligned */}
              </>
            ) : (
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
      />

      <Separator />

      <CommentReplyEditor
        commentReply={step.commentReply}
        onChange={(commentReply: CommentReply) =>
          onChange({ ...step, commentReply })
        }
      />
    </div>
  );
}
