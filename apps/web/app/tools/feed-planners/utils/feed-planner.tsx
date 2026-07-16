"use client";

import { Button } from "@delulu/design-system/components/ui/button";
import { cn } from "@delulu/design-system/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  GripVertical,
  ImagePlus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import {
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  buildComposerUrl,
  movePlannerItem,
  movePlannerItemByOffset,
  type PlannerItem,
  removePlannerItem,
} from "./feed-planner-model";
import type { FeedPlannerVariant } from "./feed-planner-pages";

interface FeedPlannerProps {
  composerUrl: string;
  variant: FeedPlannerVariant;
}

const SAMPLE_COLORS = [
  ["#f97316", "#fdba74"],
  ["#2563eb", "#93c5fd"],
  ["#7c3aed", "#c4b5fd"],
  ["#059669", "#6ee7b7"],
  ["#db2777", "#f9a8d4"],
  ["#ca8a04", "#fde047"],
  ["#0891b2", "#67e8f9"],
  ["#4f46e5", "#a5b4fc"],
  ["#dc2626", "#fca5a5"],
] as const;

const samplePreview = (
  label: string,
  colors: (typeof SAMPLE_COLORS)[number]
) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs><rect width="800" height="800" fill="url(#g)"/><circle cx="650" cy="150" r="110" fill="white" opacity=".18"/><circle cx="140" cy="690" r="180" fill="white" opacity=".12"/><text x="56" y="710" fill="white" font-family="sans-serif" font-size="58" font-weight="700">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const createSampleItems = (): PlannerItem[] =>
  SAMPLE_COLORS.map((colors, index) => ({
    id: `sample-${index + 1}`,
    name: `Sample post ${index + 1}`,
    kind: "image",
    previewUrl: samplePreview(`POST ${index + 1}`, colors),
  }));

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `media-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function FeedPlanner({ composerUrl, variant }: FeedPlannerProps) {
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const localPreviewUrls = useRef(new Set<string>());

  useEffect(
    () => () => {
      for (const url of localPreviewUrls.current) {
        URL.revokeObjectURL(url);
      }
    },
    []
  );

  const addFiles = (files: FileList | File[]) => {
    const candidates = Array.from(files);
    const accepted = candidates.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );
    const rejectedCount = candidates.length - accepted.length;
    const nextItems = accepted.map((file): PlannerItem => {
      const previewUrl = URL.createObjectURL(file);
      localPreviewUrls.current.add(previewUrl);
      return {
        id: makeId(),
        name: file.name,
        kind: file.type.startsWith("video/") ? "video" : "image",
        previewUrl,
      };
    });

    if (nextItems.length > 0) {
      setItems((current) => [...current, ...nextItems]);
      setStatusMessage(
        `${nextItems.length} ${nextItems.length === 1 ? "file" : "files"} added.${
          rejectedCount > 0
            ? ` ${rejectedCount} unsupported ${rejectedCount === 1 ? "file was" : "files were"} skipped.`
            : ""
        }`
      );
    } else if (rejectedCount > 0) {
      setStatusMessage(
        "Those files could not be added. Choose image or video files instead."
      );
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addFiles(event.target.files);
    }
    event.target.value = "";
  };

  const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFiles(false);
    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  };

  const clearItems = () => {
    for (const url of localPreviewUrls.current) {
      URL.revokeObjectURL(url);
    }
    localPreviewUrls.current.clear();
    setItems([]);
    setSelectedIds(new Set());
    setActiveItemId(null);
    setStatusMessage("All posts removed. Add photos or videos to start again.");
  };

  const loadSamples = () => {
    clearItems();
    const samples = createSampleItems();
    setItems(samples);
    setStatusMessage(`${samples.length} sample posts added.`);
  };

  const removeItem = (id: string) => {
    const item = items.find((candidate) => candidate.id === id);
    if (item && localPreviewUrls.current.has(item.previewUrl)) {
      URL.revokeObjectURL(item.previewUrl);
      localPreviewUrls.current.delete(item.previewUrl);
    }
    setItems((current) => removePlannerItem(current, id));
    setActiveItemId((current) => (current === id ? null : current));
    setStatusMessage(item ? `${item.name} removed.` : "Post removed.");
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    const item = items.find((candidate) => candidate.id === id);
    const wasSelected = selectedIds.has(id);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (wasSelected) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setActiveItemId((active) =>
      wasSelected && active === id ? null : wasSelected ? active : id
    );
    setStatusMessage(
      item
        ? `${item.name} ${wasSelected ? "deselected" : "selected"}.`
        : `Post ${wasSelected ? "deselected" : "selected"}.`
    );
  };

  const moveItem = (id: string, offset: -1 | 1) => {
    const currentIndex = items.findIndex((item) => item.id === id);
    const next = movePlannerItemByOffset(items, id, offset);
    const nextIndex = next.findIndex((item) => item.id === id);
    const item = next[nextIndex];
    setItems(next);
    if (item && currentIndex !== nextIndex) {
      setStatusMessage(`${item.name} moved to position ${nextIndex + 1}.`);
    }
  };

  const moveDroppedItem = (activeId: string, targetId: string) => {
    const next = movePlannerItem(items, activeId, targetId);
    const nextIndex = next.findIndex((item) => item.id === activeId);
    const moved = next[nextIndex];
    setItems(next);
    if (moved) {
      setStatusMessage(`${moved.name} moved to position ${nextIndex + 1}.`);
    }
  };

  const activeItem = items.find((item) => item.id === activeItemId);
  const activeIndex = activeItem
    ? items.findIndex((item) => item.id === activeItem.id)
    : -1;
  const composerActionLabel =
    selectedIds.size === 1
      ? "Create this post in Delulu"
      : selectedIds.size > 1
        ? "Create selected posts in Delulu"
        : "Create this plan in Delulu";

  const composerHref = useMemo(
    () =>
      items.length > 0
        ? buildComposerUrl(composerUrl, items, selectedIds)
        : composerUrl,
    [composerUrl, items, selectedIds]
  );

  return (
    <section
      aria-label="Plan your social feed"
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <div className="flex flex-col gap-4 border-b bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-lg">
            {variant === "grid"
              ? "Arrange your three-column grid"
              : "Arrange your post order"}
          </h2>
          <output
            aria-live="polite"
            className="mt-1 flex min-h-10 items-start gap-1.5 text-muted-foreground text-sm sm:min-h-5 sm:items-center"
          >
            <ShieldCheck className="size-4 text-emerald-600" />
            {statusMessage || "Your photos and videos stay in this browser."}
          </output>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="min-h-11"
            onClick={() => inputRef.current?.click()}
            size="sm"
            type="button"
          >
            <ImagePlus className="size-4" /> Add photos or videos
          </Button>
          <Button
            className="min-h-11"
            onClick={loadSamples}
            size="sm"
            type="button"
            variant="outline"
          >
            <RotateCcw className="size-4" /> Try sample posts
          </Button>
          <Button
            className="min-h-11"
            disabled={items.length === 0}
            onClick={clearItems}
            size="sm"
            type="button"
            variant="ghost"
          >
            Remove all
          </Button>
          <input
            accept="image/*,video/*"
            className="sr-only"
            multiple
            onChange={handleFileChange}
            ref={inputRef}
            type="file"
          />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {items.length === 0 ? (
          // biome-ignore lint/a11y/noNoninteractiveElementInteractions: File drop regions require native drag events and include keyboard-accessible file buttons.
          <section
            aria-label="Media drop area"
            className={cn(
              "flex min-h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors",
              isDraggingFiles && "border-primary bg-primary/5"
            )}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingFiles(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setIsDraggingFiles(false);
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleFileDrop}
          >
            <ImagePlus className="mb-4 size-10 text-muted-foreground" />
            <p className="font-medium">Add photos or videos to preview</p>
            <p className="mt-2 max-w-md text-muted-foreground text-sm">
              Drop files here or choose them from your device. Nothing is
              uploaded while you arrange your posts.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button
                className="min-h-11"
                onClick={() => inputRef.current?.click()}
                type="button"
              >
                Choose photos or videos
              </Button>
              <Button
                className="min-h-11"
                onClick={loadSamples}
                type="button"
                variant="outline"
              >
                Try sample posts
              </Button>
            </div>
          </section>
        ) : (
          <ul
            className={cn(
              variant === "grid"
                ? "grid grid-cols-3 gap-1 sm:gap-2"
                : "mx-auto flex max-w-lg flex-col gap-5"
            )}
          >
            {items.map((item, index) => (
              <PlannerTile
                index={index}
                item={item}
                key={item.id}
                layout={variant}
                onDragEnd={() => setDraggedId(null)}
                onDragStart={() => setDraggedId(item.id)}
                onDrop={() => {
                  if (draggedId) {
                    moveDroppedItem(draggedId, item.id);
                  }
                  setDraggedId(null);
                }}
                onMove={(offset) => moveItem(item.id, offset)}
                onRemove={() => removeItem(item.id)}
                onToggle={() => toggleSelected(item.id)}
                selected={selectedIds.has(item.id)}
                total={items.length}
              />
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && !activeItem && (
        <p className="border-t bg-muted/20 px-4 py-3 text-muted-foreground text-sm sm:hidden">
          Tap the check on a post to move or remove it.
        </p>
      )}

      {activeItem && (
        <div className="border-t bg-muted/20 p-4 sm:hidden">
          <p className="truncate font-medium text-sm">
            Adjust {activeItem.name}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Button
              className="min-h-11"
              disabled={activeIndex === 0}
              onClick={() => moveItem(activeItem.id, -1)}
              type="button"
              variant="outline"
            >
              <ArrowLeft className="size-4" /> Earlier
            </Button>
            <Button
              className="min-h-11"
              disabled={activeIndex === items.length - 1}
              onClick={() => moveItem(activeItem.id, 1)}
              type="button"
              variant="outline"
            >
              Later <ArrowRight className="size-4" />
            </Button>
            <Button
              className="min-h-11"
              onClick={() => removeItem(activeItem.id)}
              type="button"
              variant="outline"
            >
              <Trash2 className="size-4" /> Remove
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {items.length === 0
            ? "Add photos or videos to begin."
            : selectedIds.size > 0
              ? `${selectedIds.size} of ${items.length} posts selected`
              : `All ${items.length} posts will be included`}
        </p>
        <Button
          asChild={items.length > 0}
          className="min-h-11"
          disabled={items.length === 0}
        >
          {items.length > 0 ? (
            <a href={composerHref} rel="noreferrer" target="_blank">
              {composerActionLabel} <ExternalLink className="size-4" />
            </a>
          ) : (
            <span>Add photos to continue</span>
          )}
        </Button>
      </div>
      {items.length > 0 && (
        <p className="border-t px-4 py-3 text-muted-foreground text-xs">
          Your media stays on this page. Delulu opens with the order you
          selected so you can add the original photos or videos there.
        </p>
      )}
    </section>
  );
}

interface PlannerTileProps {
  item: PlannerItem;
  index: number;
  total: number;
  layout: FeedPlannerVariant;
  selected: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onMove: (offset: -1 | 1) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
}

function PlannerTile({
  item,
  index,
  total,
  layout,
  selected,
  onToggle,
  onRemove,
  onMove,
  onDragStart,
  onDragEnd,
  onDrop,
}: PlannerTileProps) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Native drag-and-drop supplements the tile's accessible move buttons.
    <li
      aria-label={`${item.name}, position ${index + 1} of ${total}`}
      className={cn(
        "group relative overflow-hidden border bg-background",
        layout === "grid" ? "aspect-square" : "rounded-xl shadow-sm",
        selected && "ring-2 ring-primary ring-offset-2"
      )}
      draggable
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDragStart={onDragStart}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
    >
      {layout === "feed" && (
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs">
            {index + 1}
          </span>
          <p className="min-w-0 flex-1 truncate font-medium text-sm">
            {item.name}
          </p>
          <GripVertical className="size-4 text-muted-foreground" />
        </div>
      )}
      <div
        className={cn(
          "relative",
          layout === "grid" ? "h-full" : "aspect-[4/5]"
        )}
      >
        {item.kind === "video" ? (
          <video
            aria-label={`Video preview for ${item.name}`}
            className="size-full object-cover"
            controls
            muted
            playsInline
            src={item.previewUrl}
          />
        ) : (
          <Image
            alt={`Preview of ${item.name}`}
            className="object-cover"
            fill
            sizes={
              layout === "grid" ? "(max-width: 640px) 30vw, 280px" : "512px"
            }
            src={item.previewUrl}
            unoptimized
          />
        )}
        {layout === "grid" && (
          <span className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-full bg-black/65 font-semibold text-white text-xs">
            {index + 1}
          </span>
        )}
        <button
          aria-label={
            selected ? `Deselect ${item.name}` : `Select ${item.name}`
          }
          aria-pressed={selected}
          className={cn(
            "absolute top-2 right-2 flex size-11 items-center justify-center rounded-full border border-white/50 shadow-sm transition-colors",
            selected
              ? "bg-primary text-primary-foreground"
              : "bg-black/60 text-white hover:bg-black/80"
          )}
          onClick={onToggle}
          type="button"
        >
          <Check className={cn("size-4", !selected && "opacity-60")} />
        </button>
        <div className="absolute right-2 bottom-2 left-2 hidden items-center justify-center gap-1 rounded-lg bg-black/65 p-1 backdrop-blur-sm sm:flex">
          <TileAction
            disabled={index === 0}
            label={`Move ${item.name} earlier`}
            onClick={() => onMove(-1)}
          >
            <ArrowLeft className="size-3.5" />
          </TileAction>
          <span className="hidden min-w-0 flex-1 truncate px-1 text-center text-white text-xs sm:block">
            {item.name}
          </span>
          <TileAction
            disabled={index === total - 1}
            label={`Move ${item.name} later`}
            onClick={() => onMove(1)}
          >
            <ArrowRight className="size-3.5" />
          </TileAction>
          <TileAction label={`Remove ${item.name}`} onClick={onRemove}>
            <Trash2 className="size-3.5" />
          </TileAction>
        </div>
      </div>
      {layout === "feed" && (
        <p className="border-t px-3 py-3 text-muted-foreground text-sm">
          Caption and publishing details can be added in the composer.
        </p>
      )}
    </li>
  );
}

function TileAction({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      className="flex size-11 shrink-0 items-center justify-center rounded-md text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
