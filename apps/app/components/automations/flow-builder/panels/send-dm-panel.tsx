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
  onChange: (step: SendDmStep) => void;
}

function renderPreview(template: string): string {
  return (template || '')
    .replace(/{username}/g, 'john_doe')
    .replace(/{comment_text}/g, 'Great post!');
}

export function SendDmPanel({ step, onChange }: SendDmPanelProps) {
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
        <div className="overflow-hidden rounded-xl border border-border bg-black">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-neutral-800 px-3 py-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />
            <span className="font-medium text-white text-xs">Your Page</span>
          </div>
          {/* Chat area */}
          <div className="flex min-h-[120px] flex-col justify-end gap-2 px-3 py-3">
            {previewText ? (
              <>
                <div className="self-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-neutral-800 px-3 py-2">
                    <p className="whitespace-pre-wrap text-white text-xs leading-relaxed">
                      {previewText}
                    </p>
                  </div>
                </div>
                {/* Quick reply buttons */}
                {quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 self-end">
                    {quickReplies.map((btn, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-blue-500 px-2.5 py-1 text-blue-400 text-[10px]"
                      >
                        {btn.title || 'Button'}
                      </span>
                    ))}
                  </div>
                )}
                {/* URL buttons */}
                {urlButtons.length > 0 && (
                  <div className="flex flex-col gap-1 self-start" style={{ maxWidth: '85%' }}>
                    {urlButtons.map((btn, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center rounded-lg bg-neutral-800 px-3 py-1.5"
                      >
                        <span className="text-blue-400 text-[10px]">
                          {btn.title || 'Link'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-neutral-500 text-xs">
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
