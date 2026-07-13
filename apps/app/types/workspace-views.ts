/**
 * View-model types for the new typed HTTP API (`@delulu/client`), derived from
 * the resource query options so UI components stay in sync with the contract
 * without duplicating the schema. These replace the legacy `types/backend.ts`
 * shapes for `PostView`-based screens.
 */
import type { createResourceOptions } from "@delulu/client";

type Resources = ReturnType<typeof createResourceOptions>;

type QueryData<T> = T extends { queryFn?: (...args: never[]) => infer R }
  ? Awaited<R>
  : never;

export type PostsPage = QueryData<ReturnType<Resources["posts"]["list"]>>;
export type PostView = PostsPage["data"][number];
export type TargetView = PostView["targets"][number];
export type PostStatus = PostView["status"];

export type ConnectionsPage = QueryData<
  ReturnType<Resources["connections"]["list"]>
>;
export type ConnectionView = ConnectionsPage["data"][number];

export type MediaView = QueryData<ReturnType<Resources["media"]["get"]>>;
