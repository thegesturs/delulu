"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Input } from "@delulu/design-system/components/ui/input";
import { Label } from "@delulu/design-system/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@delulu/design-system/components/ui/tabs";
import { Icon } from "@delulu/design-system/providers/icon";
import { Add01Icon, Delete02Icon } from "@hugeicons-pro/core-solid-rounded";
import type { DmButton } from "../utils/flow-types";
import { isValidUrl } from "../utils/flow-validation";

interface ButtonEditorProps {
  buttons: DmButton[];
  onChange: (buttons: DmButton[]) => void;
}

export function ButtonEditor({ buttons, onChange }: ButtonEditorProps) {
  const quickReplies = buttons.filter((b) => b.type === "quick_reply");
  const urlButtons = buttons.filter((b) => b.type === "url");
  const activeTab = urlButtons.length > 0 ? "url" : "quick_reply";

  const addQuickReply = () => {
    if (quickReplies.length >= 13) {
      return;
    }
    onChange([
      ...buttons.filter((b) => b.type === "quick_reply"),
      { type: "quick_reply", title: "" },
    ]);
  };

  const addUrlButton = () => {
    if (urlButtons.length >= 3) {
      return;
    }
    onChange([
      ...buttons.filter((b) => b.type === "url"),
      { type: "url", title: "", url: "" },
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
            className="flex-1"
            disabled={urlButtons.length > 0}
            value="quick_reply"
          >
            Quick Replies
          </TabsTrigger>
          <TabsTrigger
            className="flex-1"
            disabled={quickReplies.length > 0}
            value="url"
          >
            URL Buttons
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-2" value="quick_reply">
          {quickReplies.map((btn, i) => (
            <div className="flex items-center gap-2" key={i}>
              <Input
                className="flex-1"
                maxLength={20}
                onChange={(e) => updateButton(i, { title: e.target.value })}
                placeholder="Button title (max 20 chars)"
                value={btn.title}
              />
              <Button
                className="h-8 w-8 shrink-0"
                onClick={() => removeButton(i)}
                size="icon"
                variant="ghost"
              >
                <Icon
                  className="text-destructive"
                  icon={Delete02Icon}
                  size={14}
                />
              </Button>
            </div>
          ))}
          {quickReplies.length < 13 && (
            <Button
              className="w-full"
              onClick={addQuickReply}
              size="sm"
              variant="outline"
            >
              <Icon className="mr-1" icon={Add01Icon} size={14} />
              Add Quick Reply ({quickReplies.length}/13)
            </Button>
          )}
        </TabsContent>

        <TabsContent className="space-y-2" value="url">
          {urlButtons.map((btn, i) => {
            const urlIdx = buttons.indexOf(btn);
            const urlValue = "url" in btn ? btn.url : "";
            const showUrlError = urlValue.length > 0 && !isValidUrl(urlValue);
            return (
              <div
                className="space-y-1.5 rounded-lg border border-border p-2"
                key={i}
              >
                <Input
                  maxLength={20}
                  onChange={(e) =>
                    updateButton(urlIdx, { title: e.target.value })
                  }
                  placeholder="Button title (max 20 chars)"
                  value={btn.title}
                />
                {"url" in btn && (
                  <div className="space-y-1">
                    <Input
                      className={showUrlError ? "border-destructive" : ""}
                      onChange={(e) =>
                        updateButton(urlIdx, {
                          url: e.target.value,
                        } as Partial<DmButton>)
                      }
                      placeholder="https://example.com"
                      value={btn.url}
                    />
                    {showUrlError && (
                      <p className="text-[11px] text-destructive">
                        Enter a valid URL starting with https://
                      </p>
                    )}
                  </div>
                )}
                <Button
                  className="text-destructive text-xs"
                  onClick={() => removeButton(urlIdx)}
                  size="sm"
                  variant="ghost"
                >
                  <Icon className="mr-1" icon={Delete02Icon} size={12} />
                  Remove
                </Button>
              </div>
            );
          })}
          {urlButtons.length < 3 && (
            <Button
              className="w-full"
              onClick={addUrlButton}
              size="sm"
              variant="outline"
            >
              <Icon className="mr-1" icon={Add01Icon} size={14} />
              Add URL Button ({urlButtons.length}/3)
            </Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
