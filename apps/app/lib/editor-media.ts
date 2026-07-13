import type { MediaType } from "@delulu/validators/post";

export interface EditorMediaReference {
  readonly id: string;
  readonly altText?: string;
}

export interface EditorMediaDetail {
  readonly id: string;
  readonly url: string;
  readonly bucketKey: string;
  readonly mediaType: "image" | "video" | "document";
  readonly thumbnails: readonly string[];
  readonly altText: string | null;
}

/** Hydrate saved references with authoritative media metadata from the API. */
export const hydrateEditorMedia = (
  references: readonly EditorMediaReference[],
  details: ReadonlyMap<string, EditorMediaDetail>
): MediaType[] =>
  references.map((reference) => {
    const media = details.get(reference.id);
    if (!media) {
      throw new Error(`Media ${reference.id} could not be loaded`);
    }
    return {
      id: media.id,
      url: media.url,
      bucketKey: media.bucketKey,
      mediaType: media.mediaType.toUpperCase() as MediaType["mediaType"],
      altText: reference.altText ?? media.altText ?? undefined,
      thumbnailBucketUrl: media.thumbnails[0],
    };
  });
