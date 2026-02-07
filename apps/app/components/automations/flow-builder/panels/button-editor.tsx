'use client';

import { Button } from '@delulu/design-system/components/ui/button';
import { Input } from '@delulu/design-system/components/ui/input';
import { Label } from '@delulu/design-system/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@delulu/design-system/components/ui/tabs';
import { Icon } from '@delulu/design-system/providers/icon';
import { Add01Icon, Delete02Icon } from '@hugeicons-pro/core-solid-rounded';
import type { DmButton } from '../utils/flow-types';
import { isValidUrl } from '../utils/flow-validation';

interface ButtonEditorProps {
  buttons: DmButton[];
  onChange: (buttons: DmButton[]) => void;
}

export function ButtonEditor({ buttons, onChange }: ButtonEditorProps) {
  const quickReplies = buttons.filter((b) => b.type === 'quick_reply');
  const urlButtons = buttons.filter((b) => b.type === 'url');
  const activeTab = urlButtons.length > 0 ? 'url' : 'quick_reply';

  const addQuickReply = () => {
    if (quickReplies.length >= 13) {
      return;
    }
    onChange([
      ...buttons.filter((b) => b.type === 'quick_reply'),
      { type: 'quick_reply', title: '' },
    ]);
  };

  const addUrlButton = () => {
    if (urlButtons.length >= 3) {
      return;
    }
    onChange([
      ...buttons.filter((b) => b.type === 'url'),
      { type: 'url', title: '', url: '' },
    ]);
  };

  const updateButton = (index: number, patch: Partial<DmButton>) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], ...patch } as DmButton;
    onChange(newButtons);
  };

  const removeButton = (index: number) => {
    onChange(buttons.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>DM Buttons</Label>
      <p className="text-muted-foreground text-xs">
        Add tappable buttons below your DM message. Cannot mix quick replies and
        URL buttons.
      </p>

      <Tabs defaultValue={activeTab}>
        <TabsList className="w-full">
          <TabsTrigger
            value="quick_reply"
            className="flex-1"
            disabled={urlButtons.length > 0}
          >
            Quick Replies
          </TabsTrigger>
          <TabsTrigger
            value="url"
            className="flex-1"
            disabled={quickReplies.length > 0}
          >
            URL Buttons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick_reply" className="space-y-2">
          {quickReplies.map((btn, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Button title (max 20 chars)"
                value={btn.title}
                maxLength={20}
                onChange={(e) => updateButton(i, { title: e.target.value })}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeButton(i)}
              >
                <Icon
                  icon={Delete02Icon}
                  size={14}
                  className="text-destructive"
                />
              </Button>
            </div>
          ))}
          {quickReplies.length < 13 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addQuickReply}
              className="w-full"
            >
              <Icon icon={Add01Icon} size={14} className="mr-1" />
              Add Quick Reply ({quickReplies.length}/13)
            </Button>
          )}
        </TabsContent>

        <TabsContent value="url" className="space-y-2">
          {urlButtons.map((btn, i) => {
            const urlIdx = buttons.findIndex((b) => b === btn);
            const urlValue = 'url' in btn ? btn.url : '';
            const showUrlError = urlValue.length > 0 && !isValidUrl(urlValue);
            return (
              <div
                key={i}
                className="space-y-1.5 rounded-lg border border-border p-2"
              >
                <Input
                  placeholder="Button title (max 20 chars)"
                  value={btn.title}
                  maxLength={20}
                  onChange={(e) =>
                    updateButton(urlIdx, { title: e.target.value })
                  }
                />
                {'url' in btn && (
                  <div className="space-y-1">
                    <Input
                      placeholder="https://example.com"
                      value={btn.url}
                      onChange={(e) =>
                        updateButton(urlIdx, {
                          url: e.target.value,
                        } as Partial<DmButton>)
                      }
                      className={showUrlError ? 'border-destructive' : ''}
                    />
                    {showUrlError && (
                      <p className="text-[11px] text-destructive">
                        Enter a valid URL starting with https://
                      </p>
                    )}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeButton(urlIdx)}
                  className="text-destructive text-xs"
                >
                  <Icon icon={Delete02Icon} size={12} className="mr-1" />
                  Remove
                </Button>
              </div>
            );
          })}
          {urlButtons.length < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addUrlButton}
              className="w-full"
            >
              <Icon icon={Add01Icon} size={14} className="mr-1" />
              Add URL Button ({urlButtons.length}/3)
            </Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
