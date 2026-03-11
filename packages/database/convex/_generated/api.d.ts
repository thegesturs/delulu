/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as api_keys from "../api_keys.js";
import type * as articles from "../articles.js";
import type * as automationLogs from "../automationLogs.js";
import type * as automations from "../automations.js";
import type * as callmelater from "../callmelater.js";
import type * as cascade_deletes from "../cascade_deletes.js";
import type * as dodo from "../dodo.js";
import type * as http from "../http.js";
import type * as index from "../index.js";
import type * as media from "../media.js";
import type * as mediaCleanup from "../mediaCleanup.js";
import type * as posts from "../posts.js";
import type * as repairs from "../repairs.js";
import type * as schemas_api_keys from "../schemas/api_keys.js";
import type * as schemas_articles from "../schemas/articles.js";
import type * as schemas_automations from "../schemas/automations.js";
import type * as schemas_enums from "../schemas/enums.js";
import type * as schemas_index from "../schemas/index.js";
import type * as schemas_posts_media from "../schemas/posts_media.js";
import type * as schemas_social_providers from "../schemas/social_providers.js";
import type * as schemas_subscriptions from "../schemas/subscriptions.js";
import type * as schemas_transcriptions from "../schemas/transcriptions.js";
import type * as schemas_users from "../schemas/users.js";
import type * as schemas_utils from "../schemas/utils.js";
import type * as social_providers from "../social_providers.js";
import type * as stats from "../stats.js";
import type * as subscriptions from "../subscriptions.js";
import type * as transcriptions from "../transcriptions.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as webhooks from "../webhooks.js";

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
  api_keys: typeof api_keys;
  articles: typeof articles;
  automationLogs: typeof automationLogs;
  automations: typeof automations;
  callmelater: typeof callmelater;
  cascade_deletes: typeof cascade_deletes;
  dodo: typeof dodo;
  http: typeof http;
  index: typeof index;
  media: typeof media;
  mediaCleanup: typeof mediaCleanup;
  posts: typeof posts;
  repairs: typeof repairs;
  "schemas/api_keys": typeof schemas_api_keys;
  "schemas/articles": typeof schemas_articles;
  "schemas/automations": typeof schemas_automations;
  "schemas/enums": typeof schemas_enums;
  "schemas/index": typeof schemas_index;
  "schemas/posts_media": typeof schemas_posts_media;
  "schemas/social_providers": typeof schemas_social_providers;
  "schemas/subscriptions": typeof schemas_subscriptions;
  "schemas/transcriptions": typeof schemas_transcriptions;
  "schemas/users": typeof schemas_users;
  "schemas/utils": typeof schemas_utils;
  social_providers: typeof social_providers;
  stats: typeof stats;
  subscriptions: typeof subscriptions;
  transcriptions: typeof transcriptions;
  users: typeof users;
  utils: typeof utils;
  webhooks: typeof webhooks;
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
  postsByUserStatus: {
    btree: {
      aggregateBetween: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any },
        { count: number; sum: number }
      >;
      atNegativeOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      get: FunctionReference<
        "query",
        "internal",
        { key: any; namespace?: any },
        null | { k: any; s: number; v: any }
      >;
      offset: FunctionReference<
        "query",
        "internal",
        { k1?: any; key: any; namespace?: any },
        number
      >;
      offsetUntil: FunctionReference<
        "query",
        "internal",
        { k2?: any; key: any; namespace?: any },
        number
      >;
      paginate: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          k1?: any;
          k2?: any;
          limit: number;
          namespace?: any;
          order: "asc" | "desc";
        },
        {
          cursor: string;
          isDone: boolean;
          page: Array<{ k: any; s: number; v: any }>;
        }
      >;
      paginateNamespaces: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit: number },
        { cursor: string; isDone: boolean; page: Array<any> }
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { namespace?: any },
        any
      >;
    };
    inspect: {
      display: FunctionReference<"query", "internal", { namespace?: any }, any>;
      dump: FunctionReference<"query", "internal", { namespace?: any }, string>;
      inspectNode: FunctionReference<
        "query",
        "internal",
        { namespace?: any; node?: string },
        null
      >;
    };
    public: {
      clear: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      deleteIfExists: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        any
      >;
      delete_: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        null
      >;
      init: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any; summand?: number; value: any },
        null
      >;
      makeRootLazy: FunctionReference<
        "mutation",
        "internal",
        { namespace?: any },
        null
      >;
      replace: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        null
      >;
      replaceOrInsert: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        any
      >;
    };
  };
  migrations: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; names?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      migrate: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
  };
  dodopayments: {
    lib: {
      checkout: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          environment: "test_mode" | "live_mode";
          payload: {
            allowed_payment_method_types?: Array<string>;
            billing_address?: {
              city?: string;
              country: string;
              state?: string;
              street?: string;
              zipcode?: string;
            };
            billing_currency?: string;
            confirm?: boolean;
            customer?: { email?: string; name?: string; phone_number?: string };
            customization?: {
              show_on_demand_tag?: boolean;
              show_order_details?: boolean;
              theme?: string;
            };
            discount_code?: string;
            feature_flags?: {
              allow_currency_selection?: boolean;
              allow_discount_code?: boolean;
              allow_phone_number_collection?: boolean;
              allow_tax_id?: boolean;
              always_create_new_customer?: boolean;
            };
            metadata?: Record<string, string>;
            product_cart: Array<{ product_id: string; quantity: number }>;
            return_url?: string;
            show_saved_payment_methods?: boolean;
            subscription_data?: { trial_period_days?: number };
          };
        },
        { checkout_url: string }
      >;
      customerPortal: FunctionReference<
        "action",
        "internal",
        {
          apiKey: string;
          dodoCustomerId: string;
          environment: "test_mode" | "live_mode";
          send_email?: boolean;
        },
        { portal_url: string }
      >;
    };
  };
};
