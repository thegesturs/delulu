"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Label } from "@delulu/design-system/components/ui/label";
import { Separator } from "@delulu/design-system/components/ui/separator";
import { Textarea } from "@delulu/design-system/components/ui/textarea";
import type { DmButton, SendDmStep } from "../utils/flow-types";
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
  const insertVariable = (variable: string) => {
    onChange({
      ...step,
      messageTemplate: step.messageTemplate + variable,
    });
  };

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

      {/* Instagram DM Preview */}
      <div className="space-y-2">
        <Label>Preview</Label>
        <div className="overflow-hidden rounded-xl border border-border bg-neutral-100 dark:bg-neutral-900">
          {/* Chat area */}
          <div className="flex min-h-[100px] flex-col justify-end gap-1 px-3 py-3">
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
        onCreateStepForButton={onCreateStepForButton}
        onRemoveStepForButton={onRemoveStepForButton}
      />
    </div>
  );
}
