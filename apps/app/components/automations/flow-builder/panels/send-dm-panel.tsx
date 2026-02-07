'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { Label } from '@delulu/design-system/components/ui/label';
import { Separator } from '@delulu/design-system/components/ui/separator';
import { Textarea } from '@delulu/design-system/components/ui/textarea';
import type { CommentReply, DmButton, SendDmStep } from '../utils/flow-types';
import { ButtonEditor } from './button-editor';
import { CommentReplyEditor } from './comment-reply-editor';

const VARIABLES = [
  { name: '{username}', description: "Commenter's Instagram username" },
  { name: '{comment_text}', description: 'Full text of the comment' },
];

interface SendDmPanelProps {
  step: SendDmStep;
  isFreePlan?: boolean;
  onChange: (step: SendDmStep) => void;
}

function renderPreview(template: string): string {
  return (template || '')
    .replace(/{username}/g, 'john_doe')
    .replace(/{comment_text}/g, 'Great post!');
}

export function SendDmPanel({ step, isFreePlan, onChange }: SendDmPanelProps) {
  const insertVariable = (variable: string) => {
    onChange({
      ...step,
      messageTemplate: step.messageTemplate + variable,
    });
  };

  const previewText = renderPreview(step.messageTemplate);
  const quickReplies = (step.buttons ?? []).filter((b) => b.type === 'quick_reply');
  const urlButtons = (step.buttons ?? []).filter((b) => b.type === 'url');

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
              key={variable.name}
              variant="outline"
              size="sm"
              onClick={() => insertVariable(variable.name)}
              className="text-xs"
            >
              {variable.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Message Template</Label>
        <Textarea
          placeholder="Enter the message to send..."
          value={step.messageTemplate}
          onChange={(e) => onChange({ ...step, messageTemplate: e.target.value })}
          rows={5}
          className="font-mono text-sm"
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
                    <div className={`rounded-2xl rounded-bl-md bg-white px-3 py-2.5 shadow-sm dark:bg-neutral-800 ${
                      urlButtons.length > 0 ? 'rounded-b-md' : ''
                    }`}>
                      <p className="whitespace-pre-wrap text-neutral-900 text-xs leading-relaxed dark:text-neutral-100">
                        {previewText}
                      </p>
                      {isFreePlan && (
                        <p className="mt-2 border-t border-neutral-200 pt-2 text-neutral-400 text-[10px] dark:border-neutral-700 dark:text-neutral-500">
                          - - -<br />
                          Sent via @delulu.social
                        </p>
                      )}
                    </div>
                    {/* URL buttons — attached below the bubble */}
                    {urlButtons.length > 0 && (
                      <div className="flex flex-col">
                        {urlButtons.map((btn, i) => (
                          <div
                            key={i}
                            className={`flex items-center justify-center border-t border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800 ${
                              i === urlButtons.length - 1
                                ? 'rounded-b-2xl rounded-bl-md'
                                : ''
                            }`}
                          >
                            <span className="font-medium text-neutral-900 text-xs dark:text-neutral-100">
                              {btn.title || 'Button'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Quick reply buttons — separate row, right-aligned */}
                {quickReplies.length > 0 && (
                  <div className="mt-1 flex flex-wrap justify-end gap-1.5 pl-8">
                    {quickReplies.map((btn, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-blue-500 bg-white px-2.5 py-1 text-blue-500 text-[10px] shadow-sm dark:bg-neutral-800 dark:text-blue-400"
                      >
                        {btn.title || 'Button'}
                      </span>
                    ))}
                  </div>
                )}
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
        onChange={(commentReply: CommentReply) => onChange({ ...step, commentReply })}
      />
    </div>
  );
}
