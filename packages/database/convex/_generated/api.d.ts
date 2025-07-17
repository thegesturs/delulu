/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as cascadeDeletes from "../cascade-deletes.js";
import type * as index from "../index.js";
import type * as media from "../media.js";
import type * as posts from "../posts.js";
import type * as schemas from "../schemas.js";
import type * as socialProviders from "../social-providers.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  cascadeDeletes: typeof cascadeDeletes;
  index: typeof index;
  media: typeof media;
  posts: typeof posts;
  schemas: typeof schemas;
  socialProviders: typeof socialProviders;
  users: typeof users;
  utils: typeof utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
