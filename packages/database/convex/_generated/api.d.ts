/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cascade_deletes from "../cascade_deletes.js";
import type * as http from "../http.js";
import type * as index from "../index.js";
import type * as media from "../media.js";
import type * as posts from "../posts.js";
import type * as schemas_enums from "../schemas/enums.js";
import type * as schemas_index from "../schemas/index.js";
import type * as schemas_posts_media from "../schemas/posts_media.js";
import type * as schemas_social_providers from "../schemas/social_providers.js";
import type * as schemas_users from "../schemas/users.js";
import type * as schemas_utils from "../schemas/utils.js";
import type * as social_providers from "../social_providers.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  cascade_deletes: typeof cascade_deletes;
  http: typeof http;
  index: typeof index;
  media: typeof media;
  posts: typeof posts;
  "schemas/enums": typeof schemas_enums;
  "schemas/index": typeof schemas_index;
  "schemas/posts_media": typeof schemas_posts_media;
  "schemas/social_providers": typeof schemas_social_providers;
  "schemas/users": typeof schemas_users;
  "schemas/utils": typeof schemas_utils;
  social_providers: typeof social_providers;
  users: typeof users;
  utils: typeof utils;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      get: FunctionReference<"query", "internal", { emailId: string }, any>;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          errorMessage: string | null;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced";
        }
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject: string;
          text?: string;
          to: string;
        },
        string
      >;
    };
  };
};
