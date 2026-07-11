import { MediaId, makeId } from "@delulu/core";
import { epochToDateOr } from "../idmap";
import type { LegacyContentMedia, LegacyMedia } from "../legacy";
import type { TransformContext } from "./context";
import { COUNTER } from "./counters";
import { resolveWorkspace } from "./ownership";

const lowerType = (type: string): "image" | "video" | "document" => {
  const lowered = type.toLowerCase();
  return lowered === "video" || lowered === "document" ? lowered : "image";
};

interface MediaIndexEntry {
  readonly mediaId: string;
  readonly workspaceId: string;
  readonly url: string;
  readonly bucketKey: string;
  readonly mediaType: "image" | "video" | "document";
}

/**
 * Resolves embedded post-media references to migrated media ids, synthesizing a
 * row when the reference doesn't resolve or lands in another workspace, so a
 * MediaRef is never dangling and R2 bytes are shared (spec §4.5).
 */
export class MediaResolver {
  private readonly ctx: TransformContext;
  /** lookup key (bucketKey/url/bucketUrl/thumbnailBucketKey) → media row. */
  private readonly index: ReadonlyMap<string, MediaIndexEntry>;

  constructor(
    ctx: TransformContext,
    index: ReadonlyMap<string, MediaIndexEntry>
  ) {
    this.ctx = ctx;
    this.index = index;
  }

  private lookup(embedded: LegacyContentMedia): MediaIndexEntry | undefined {
    const keys = [
      embedded.bucketKey,
      embedded.url,
      embedded.bucketUrl,
      embedded.thumbnailBucketKey,
    ];
    for (const key of keys) {
      if (key !== undefined && key !== "") {
        const hit = this.index.get(key);
        if (hit) {
          return hit;
        }
      }
    }
    return undefined;
  }

  resolve(
    embedded: LegacyContentMedia,
    workspaceId: string
  ): { id: string; altText?: string } {
    const hit = this.lookup(embedded);
    const altText = embedded.altText;
    if (hit && hit.workspaceId === workspaceId) {
      return altText === undefined
        ? { id: hit.mediaId }
        : { id: hit.mediaId, altText };
    }
    // Cross-workspace hit or no hit → synthesize a row in the target workspace.
    if (hit) {
      this.ctx.counters.bump(COUNTER.mediaSynthesizedCrossWorkspace);
    } else {
      this.ctx.counters.bump(COUNTER.mediaSynthesizedUnresolved);
    }
    const id = makeId(MediaId);
    const now = new Date(0);
    const bucketKey =
      embedded.bucketKey ??
      embedded.url ??
      embedded.bucketUrl ??
      `migrated/${id}`;
    const url = embedded.url ?? embedded.bucketUrl ?? bucketKey;
    this.ctx.load.media.push({
      id,
      legacyConvexId: null,
      workspaceId,
      bucketKey,
      url,
      mediaType: lowerType(embedded.mediaType),
      mimeType: null,
      sizeBytes: 0,
      width: null,
      height: null,
      durationSeconds: null,
      thumbnails: JSON.stringify(
        embedded.thumbnailBucketKey ? [embedded.thumbnailBucketKey] : []
      ),
      altText: altText ?? null,
      status: "ready",
      createdAt: now,
      updatedAt: now,
    });
    return altText === undefined ? { id } : { id, altText };
  }
}

/** media → media table (status ready) + a MediaResolver over the migrated rows. */
export const transformMedia = (
  ctx: TransformContext,
  mediaDocs: readonly LegacyMedia[]
): MediaResolver => {
  const index = new Map<string, MediaIndexEntry>();
  for (const media of mediaDocs) {
    const workspaceId = resolveWorkspace(ctx, {
      organizationId: media.organizationId,
      userId: media.userId,
      entity: "media",
      legacyId: media._id,
    });
    const mediaId = ctx.ids.media.getOrCreate(media._id);
    const mediaType = lowerType(media.mediaType);
    const entry: MediaIndexEntry = {
      mediaId,
      workspaceId,
      url: media.url,
      bucketKey: media.bucketKey,
      mediaType,
    };
    // Index by every locator embedded content might reference.
    for (const key of [
      media.bucketKey,
      media.url,
      media.bucketUrl,
      media.thumbnailBucketKey,
    ]) {
      if (key !== undefined && key !== "" && !index.has(key)) {
        index.set(key, entry);
      }
    }

    ctx.load.media.push({
      id: mediaId,
      legacyConvexId: media._id,
      workspaceId,
      bucketKey: media.bucketKey,
      url: media.url,
      mediaType,
      mimeType: null,
      sizeBytes: media.size ?? 0,
      width: null,
      height: null,
      durationSeconds: null,
      thumbnails: JSON.stringify(
        media.thumbnailBucketKey ? [media.thumbnailBucketKey] : []
      ),
      altText: media.altText ?? null,
      status: "ready",
      createdAt: epochToDateOr(
        media.createdAt ?? media._creationTime,
        media._creationTime
      ),
      updatedAt: epochToDateOr(media.updatedAt, media._creationTime),
    });
  }
  return new MediaResolver(ctx, index);
};
