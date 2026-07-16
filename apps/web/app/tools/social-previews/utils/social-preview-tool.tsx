"use client";

import { SocialPostPreview } from "@delulu/design-system/components/social-preview/social-post-preview";
import { InstagramProfilePreview } from "@delulu/design-system/components/social-preview/social-profile-preview";
import { Button } from "@delulu/design-system/components/ui/button";
import { Input } from "@delulu/design-system/components/ui/input";
import { Label } from "@delulu/design-system/components/ui/label";
import { SocialIcon } from "@delulu/design-system/components/ui/social-icon";
import { Textarea } from "@delulu/design-system/components/ui/textarea";
import {
  type SupportedSocialPlatform,
  socialDisplayNames,
} from "@delulu/design-system/lib/social-config";
import {
  CalendarDays,
  ChevronDown,
  ImagePlus,
  RotateCcw,
  Share2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createExampleState,
  EMPTY_STATE,
  formatPreviewDate,
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
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs" htmlFor={id}>
        {label}
      </Label>
      <Input
        className="min-h-11"
        id={id}
        min={0}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        type="number"
        value={value}
      />
    </div>
  );
}

function UploadControl({
  id,
  label,
  multiple,
  accept = "image/*",
  status,
  onFiles,
}: {
  id: string;
  label: string;
  multiple?: boolean;
  accept?: string;
  status?: string;
  onFiles: (files: File[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <label
        className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background px-3 font-medium text-sm transition-colors hover:bg-muted"
        htmlFor={id}
      >
        <ImagePlus aria-hidden className="size-4" />
        {multiple ? "Choose images" : "Choose image"}
      </label>
      <Input
        accept={accept}
        className="sr-only"
        id={id}
        key={id}
        multiple={multiple}
        onChange={(event) =>
          onFiles(Array.from(event.currentTarget.files ?? []))
        }
        type="file"
      />
      {status && (
        <output className="block text-muted-foreground text-xs">
          {status}
        </output>
      )}
    </div>
  );
}

function PreviewMedia({
  alt,
  platform,
  mediaType,
  url,
}: {
  alt: string;
  platform: SupportedSocialPlatform;
  mediaType: "image" | "video";
  url?: string;
}) {
  if (!url) {
    return (
      <div
        className={
          platform === "TIKTOK"
            ? "flex size-full items-center justify-center bg-gradient-to-br from-zinc-800 to-black text-white/60"
            : platform === "YOUTUBE"
              ? "flex aspect-video items-center justify-center bg-muted text-muted-foreground"
              : "flex aspect-square items-center justify-center bg-muted text-muted-foreground"
        }
      >
        <ImagePlus aria-hidden className="size-8" />
      </div>
    );
  }

  if (mediaType === "video") {
    return (
      <video
        autoPlay
        className={
          platform === "TIKTOK"
            ? "size-full object-cover"
            : platform === "YOUTUBE"
              ? "aspect-video w-full object-cover"
              : "aspect-square w-full object-cover"
        }
        loop
        muted
        playsInline
        src={url}
      />
    );
  }

  return (
    <div
      className={
        platform === "TIKTOK"
          ? "relative size-full"
          : platform === "YOUTUBE"
            ? "relative aspect-video w-full"
            : "relative aspect-square w-full"
      }
    >
      <img
        alt={alt || "Post media preview"}
        className="absolute inset-0 size-full object-cover"
        src={url}
      />
    </div>
  );
}

export function SocialPreviewTool({
  kind,
  platform,
  platforms,
  example,
}: {
  kind: SocialPreviewKind;
  platform: SupportedSocialPlatform;
  platforms?: SupportedSocialPlatform[];
  example: SocialPreviewExample;
}) {
  const [state, setState] = useState<PreviewState>(() =>
    createExampleState(example)
  );
  const [fileInputKey, setFileInputKey] = useState(0);
  const objectUrls = useRef(new Set<string>());
  const isProfile = kind === "profile";
  const isAll = kind === "all";
  const previewPlatforms = platforms ?? [platform];
  const includesLinkedIn = previewPlatforms.includes("LINKEDIN");
  const platformName = isAll ? "All channels" : socialDisplayNames[platform];

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
      update(
        "mediaType",
        files[0]?.type.startsWith("video/") ? "video" : "image"
      );
      update("mediaUrls", nextUrls);
    }
  };

  const composerUrl = useMemo(() => buildComposerUrl(state.text), [state.text]);
  const renderMedia = (previewPlatform: SupportedSocialPlatform) => (
    <PreviewMedia
      alt={state.altText}
      mediaType={state.mediaType}
      platform={previewPlatform}
      url={state.mediaUrls[0]}
    />
  );

  return (
    <section
      aria-label="Live social preview editor"
      className={`relative left-1/2 grid -translate-x-1/2 overflow-hidden rounded-2xl border bg-background shadow-sm lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] ${isAll ? "w-[min(96vw,96rem)]" : "w-[min(92vw,80rem)]"}`}
    >
      <form
        className="min-w-0 space-y-6 p-5 sm:p-6 lg:border-r"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isAll ? (
                <span className="flex -space-x-1.5">
                  {previewPlatforms.slice(0, 4).map((previewPlatform) => (
                    <span
                      className="flex size-7 items-center justify-center rounded-full border bg-background"
                      key={previewPlatform}
                    >
                      <SocialIcon size="sm" type={previewPlatform} />
                    </span>
                  ))}
                </span>
              ) : (
                <SocialIcon size="md" type={platform} />
              )}
              <h2 className="truncate font-semibold text-lg">
                {isProfile
                  ? "Edit profile"
                  : isAll
                    ? "Edit once, compare everywhere"
                    : "Edit post"}
              </h2>
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              {isAll
                ? "One draft updates every preview instantly."
                : "Changes appear in the preview instantly."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              aria-label="Load example"
              className="min-h-10 px-3"
              onClick={() => replaceState(createExampleState(example))}
              size="sm"
              type="button"
              variant="ghost"
            >
              Example
            </Button>
            <Button
              aria-label="Reset preview"
              className="min-h-10 px-2.5"
              onClick={() => replaceState(EMPTY_STATE)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <RotateCcw aria-hidden className="size-4" />
            </Button>
          </div>
        </div>

        <fieldset className="space-y-4">
          <legend className="mb-3 font-medium text-sm">Identity</legend>
          <div className="space-y-1.5">
            <Label htmlFor={`${platform}-display-name`}>
              {platform === "YOUTUBE" && !isAll
                ? "Channel name"
                : "Display name"}
            </Label>
            <Input
              className="min-h-11"
              id={`${platform}-display-name`}
              maxLength={80}
              onChange={(event) =>
                update("displayName", event.currentTarget.value)
              }
              placeholder="Maya Chen"
              value={state.displayName}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${platform}-username`}>
              {platform === "FACEBOOK"
                ? "Page username"
                : platform === "YOUTUBE" && !isAll
                  ? "Channel handle"
                  : "Username"}
            </Label>
            <Input
              className="min-h-11"
              id={`${platform}-username`}
              maxLength={40}
              onChange={(event) =>
                update("username", event.currentTarget.value)
              }
              placeholder="mayamakes"
              value={state.username}
            />
          </div>
          {includesLinkedIn && (
            <div className="space-y-1.5">
              <Label htmlFor="linkedin-headline">Professional headline</Label>
              <Input
                className="min-h-11"
                id="linkedin-headline"
                maxLength={160}
                onChange={(event) =>
                  update("headline", event.currentTarget.value)
                }
                placeholder="Product lead · Building calmer workflows"
                value={state.headline}
              />
            </div>
          )}
          <UploadControl
            id={`${platform}-avatar-${fileInputKey}`}
            label="Profile image"
            onFiles={(files) => replaceLocalUrls("avatarUrl", files)}
            status={state.avatarUrl ? "Profile image selected" : undefined}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-3 font-medium text-sm">
            {isProfile ? "Bio and grid" : "Content"}
          </legend>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor={`${platform}-text`}>
                {isProfile
                  ? "Profile bio"
                  : platform === "YOUTUBE" && !isAll
                    ? "Video title and description"
                    : "Post text"}
              </Label>
              <span className="text-muted-foreground text-xs">
                {state.text.length}
              </span>
            </div>
            <Textarea
              className="min-h-36 resize-y"
              id={`${platform}-text`}
              maxLength={3000}
              onChange={(event) => update("text", event.currentTarget.value)}
              placeholder={
                isProfile ? "Describe this profile…" : "Write your post…"
              }
              value={state.text}
            />
          </div>
          <UploadControl
            accept={isProfile ? "image/*" : "image/*,video/*"}
            id={`${platform}-media-${fileInputKey}`}
            label={isProfile ? "Grid images" : "Post media"}
            multiple={isProfile}
            onFiles={(files) => replaceLocalUrls("mediaUrls", files)}
            status={
              state.mediaUrls.length > 0
                ? `${state.mediaUrls.length} ${state.mediaUrls.length === 1 ? "file" : "files"} selected`
                : undefined
            }
          />
          <div className="space-y-1.5">
            <Label htmlFor={`${platform}-alt-text`}>Image description</Label>
            <Input
              className="min-h-11"
              id={`${platform}-alt-text`}
              maxLength={300}
              onChange={(event) => update("altText", event.currentTarget.value)}
              placeholder="Describe the useful visual details"
              value={state.altText}
            />
          </div>
        </fieldset>

        <details className="group rounded-xl border bg-muted/20">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-medium text-sm">
            {isProfile ? (
              <UserRound aria-hidden className="size-4" />
            ) : (
              <CalendarDays aria-hidden className="size-4" />
            )}
            {isProfile ? "Profile counts" : "Post details"}
            <ChevronDown
              aria-hidden
              className="ml-auto size-4 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="space-y-4 border-t p-4">
            {!isProfile && (
              <div className="space-y-1.5">
                <Label htmlFor={`${platform}-date`}>Post date</Label>
                <Input
                  className="min-h-11"
                  id={`${platform}-date`}
                  onChange={(event) =>
                    update("date", event.currentTarget.value)
                  }
                  type="date"
                  value={state.date}
                />
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-3">
              {isProfile ? (
                <>
                  <NumberField
                    id={`${platform}-posts`}
                    label="Posts"
                    onChange={(value) => update("posts", value)}
                    value={state.posts}
                  />
                  <NumberField
                    id={`${platform}-followers`}
                    label="Followers"
                    onChange={(value) => update("followers", value)}
                    value={state.followers}
                  />
                  <NumberField
                    id={`${platform}-following`}
                    label="Following"
                    onChange={(value) => update("following", value)}
                    value={state.following}
                  />
                </>
              ) : (
                <>
                  <NumberField
                    id={`${platform}-likes`}
                    label={
                      isAll
                        ? "Likes / reactions"
                        : platform === "LINKEDIN"
                          ? "Reactions"
                          : "Likes"
                    }
                    onChange={(value) => update("likes", value)}
                    value={state.likes}
                  />
                  <NumberField
                    id={`${platform}-comments`}
                    label="Comments"
                    onChange={(value) => update("comments", value)}
                    value={state.comments}
                  />
                  <NumberField
                    id={`${platform}-shares`}
                    label={
                      isAll
                        ? "Shares / reposts"
                        : platform === "TWITTER"
                          ? "Reposts"
                          : "Shares"
                    }
                    onChange={(value) => update("shares", value)}
                    value={state.shares}
                  />
                </>
              )}
            </div>
          </div>
        </details>

        {!isProfile && (
          <Button asChild className="min-h-11 w-full" size="lg">
            <a href={composerUrl} rel="noopener noreferrer">
              Create this post in Delulu <Share2 aria-hidden />
            </a>
          </Button>
        )}
      </form>

      <aside
        aria-label={`${platformName} live preview`}
        className="min-w-0 border-t bg-muted/30 p-4 sm:p-8 lg:border-t-0"
      >
        <div className={isAll ? undefined : "lg:sticky lg:top-24"}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-medium text-sm">{platformName} preview</p>
            <span className="rounded-full border bg-background px-2.5 py-1 text-muted-foreground text-xs">
              Private
            </span>
          </div>
          {isProfile ? (
            <InstagramProfilePreview
              avatarUrl={state.avatarUrl}
              bio={state.text}
              displayName={state.displayName}
              followers={state.followers}
              following={state.following}
              mediaAltText={state.altText}
              mediaUrls={state.mediaUrls}
              posts={state.posts}
              username={state.username}
            />
          ) : isAll ? (
            <div className="grid items-start gap-6 xl:grid-cols-2">
              {previewPlatforms.map((previewPlatform) => (
                <SocialPostPreview
                  avatarUrl={state.avatarUrl}
                  comments={state.comments}
                  dateLabel={formatPreviewDate(state.date)}
                  displayName={state.displayName}
                  headline={state.headline}
                  key={previewPlatform}
                  likes={state.likes}
                  media={renderMedia(previewPlatform)}
                  platform={previewPlatform}
                  shares={state.shares}
                  text={state.text}
                  username={state.username}
                />
              ))}
            </div>
          ) : (
            <SocialPostPreview
              avatarUrl={state.avatarUrl}
              comments={state.comments}
              dateLabel={formatPreviewDate(state.date)}
              displayName={state.displayName}
              headline={state.headline}
              likes={state.likes}
              media={renderMedia(platform)}
              platform={platform}
              shares={state.shares}
              text={state.text}
              username={state.username}
            />
          )}
        </div>
      </aside>
    </section>
  );
}
