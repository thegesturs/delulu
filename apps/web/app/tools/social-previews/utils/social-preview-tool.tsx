"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { Input } from "@delulu/design-system/components/ui/input";
import { Label } from "@delulu/design-system/components/ui/label";
import { Textarea } from "@delulu/design-system/components/ui/textarea";
import { CalendarDays, RotateCcw, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { InstagramPostPreviewCard } from "../instagram-post-preview/preview-card";
import { InstagramProfilePreviewCard } from "../instagram-profile-preview/preview-card";
import { LinkedInPostPreviewCard } from "../linkedin-post-preview/preview-card";
import {
  createExampleState,
  EMPTY_STATE,
  type PreviewState,
} from "./preview-state";
import {
  buildComposerUrl,
  type SocialPreviewExample,
  type SocialPreviewKind,
} from "./social-preview-tools";

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        min={0}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        type="number"
        value={value}
      />
    </div>
  );
}

export function SocialPreviewTool({
  kind,
  example,
}: {
  kind: SocialPreviewKind;
  example: SocialPreviewExample;
}) {
  const [state, setState] = useState<PreviewState>(() =>
    createExampleState(example)
  );
  const [fileInputKey, setFileInputKey] = useState(0);
  const objectUrls = useRef(new Set<string>());
  const isProfile = kind === "instagram-profile";

  useEffect(
    () => () => {
      for (const url of objectUrls.current) {
        URL.revokeObjectURL(url);
      }
    },
    []
  );

  const update = <Key extends keyof PreviewState>(
    key: Key,
    value: PreviewState[Key]
  ) => setState((current) => ({ ...current, [key]: value }));

  const replaceState = (nextState: PreviewState) => {
    for (const url of objectUrls.current) {
      URL.revokeObjectURL(url);
    }
    objectUrls.current.clear();
    setState(nextState);
    setFileInputKey((current) => current + 1);
  };

  const replaceLocalUrls = (key: "avatarUrl" | "mediaUrls", files: File[]) => {
    const currentUrls =
      key === "avatarUrl" ? [state.avatarUrl] : state.mediaUrls;
    for (const url of currentUrls) {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
        objectUrls.current.delete(url);
      }
    }
    const nextUrls = files
      .slice(0, key === "mediaUrls" && isProfile ? 9 : 1)
      .map((file) => URL.createObjectURL(file));
    for (const url of nextUrls) {
      objectUrls.current.add(url);
    }
    if (key === "avatarUrl") {
      update("avatarUrl", nextUrls[0] ?? "");
    } else {
      update("mediaUrls", nextUrls);
    }
  };

  const composerUrl = useMemo(() => buildComposerUrl(state.text), [state.text]);

  return (
    <section
      aria-label="Live social preview editor"
      className="grid gap-6 rounded-2xl border bg-card p-4 shadow-sm lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:p-6"
    >
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-xl">Customize your preview</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Updates live. Files stay in your browser.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => replaceState(createExampleState(example))}
              size="sm"
              type="button"
              variant="outline"
            >
              Example
            </Button>
            <Button
              onClick={() => replaceState(EMPTY_STATE)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <RotateCcw aria-hidden /> Reset
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${kind}-display-name`}>Display name</Label>
            <Input
              id={`${kind}-display-name`}
              maxLength={80}
              onChange={(event) =>
                update("displayName", event.currentTarget.value)
              }
              placeholder="Maya Chen"
              value={state.displayName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${kind}-username`}>Username</Label>
            <Input
              id={`${kind}-username`}
              maxLength={40}
              onChange={(event) =>
                update("username", event.currentTarget.value)
              }
              placeholder="mayamakes"
              value={state.username}
            />
          </div>
        </div>

        {kind === "linkedin-post" && (
          <div className="space-y-2">
            <Label htmlFor={`${kind}-headline`}>Professional headline</Label>
            <Input
              id={`${kind}-headline`}
              maxLength={160}
              onChange={(event) =>
                update("headline", event.currentTarget.value)
              }
              placeholder="Product lead · Building calmer workflows"
              value={state.headline}
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${kind}-text`}>
              {isProfile ? "Profile bio" : "Post text"}
            </Label>
            <span className="text-muted-foreground text-xs">
              {state.text.length} characters
            </span>
          </div>
          <Textarea
            className="min-h-32 resize-y"
            id={`${kind}-text`}
            maxLength={3000}
            onChange={(event) => update("text", event.currentTarget.value)}
            placeholder={
              isProfile ? "Describe this profile..." : "Write your post..."
            }
            value={state.text}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${kind}-avatar`}>Avatar image</Label>
            <Input
              accept="image/*"
              id={`${kind}-avatar`}
              key={`${fileInputKey}-avatar`}
              onChange={(event) =>
                replaceLocalUrls(
                  "avatarUrl",
                  Array.from(event.currentTarget.files ?? []).slice(0, 1)
                )
              }
              type="file"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${kind}-media`}>
              {isProfile ? "Grid images (up to 9)" : "Post image"}
            </Label>
            <Input
              accept="image/*"
              id={`${kind}-media`}
              key={`${fileInputKey}-media`}
              multiple={isProfile}
              onChange={(event) =>
                replaceLocalUrls(
                  "mediaUrls",
                  Array.from(event.currentTarget.files ?? [])
                )
              }
              type="file"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${kind}-alt-text`}>
            {isProfile ? "Grid image description" : "Image alt text"}
          </Label>
          <Input
            id={`${kind}-alt-text`}
            maxLength={300}
            onChange={(event) => update("altText", event.currentTarget.value)}
            placeholder={
              isProfile
                ? "Describe the common subject or visual theme"
                : "Describe the useful visual details"
            }
            value={state.altText}
          />
          {isProfile && (
            <p className="text-muted-foreground text-xs leading-5">
              Used as an accessible description for each selected grid image.
            </p>
          )}
        </div>

        {isProfile ? (
          <div className="grid grid-cols-3 gap-3">
            <NumberField
              id={`${kind}-posts`}
              label="Posts"
              onChange={(value) => update("posts", value)}
              value={state.posts}
            />
            <NumberField
              id={`${kind}-followers`}
              label="Followers"
              onChange={(value) => update("followers", value)}
              value={state.followers}
            />
            <NumberField
              id={`${kind}-following`}
              label="Following"
              onChange={(value) => update("following", value)}
              value={state.following}
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${kind}-date`}>
                <CalendarDays aria-hidden className="size-4" /> Post date
              </Label>
              <Input
                id={`${kind}-date`}
                onChange={(event) => update("date", event.currentTarget.value)}
                type="date"
                value={state.date}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumberField
                id={`${kind}-likes`}
                label={kind === "linkedin-post" ? "Reactions" : "Likes"}
                onChange={(value) => update("likes", value)}
                value={state.likes}
              />
              <NumberField
                id={`${kind}-comments`}
                label="Comments"
                onChange={(value) => update("comments", value)}
                value={state.comments}
              />
              <NumberField
                id={`${kind}-shares`}
                label="Shares"
                onChange={(value) => update("shares", value)}
                value={state.shares}
              />
            </div>
          </>
        )}

        {!isProfile && (
          <Button asChild className="w-full" size="lg">
            <a href={composerUrl} rel="noopener noreferrer">
              Create this post in Delulu <Share2 aria-hidden />
            </a>
          </Button>
        )}
      </form>

      <div className="flex min-w-0 items-start justify-center rounded-xl bg-muted/50 p-3 sm:p-6 lg:sticky lg:top-24">
        {kind === "instagram-post" && (
          <InstagramPostPreviewCard state={state} />
        )}
        {kind === "linkedin-post" && <LinkedInPostPreviewCard state={state} />}
        {kind === "instagram-profile" && (
          <InstagramProfilePreviewCard state={state} />
        )}
      </div>
    </section>
  );
}
