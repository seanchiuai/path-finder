/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bookmarks from "../bookmarks.js";
import type * as chat from "../chat.js";
import type * as chatMessages from "../chatMessages.js";
import type * as embeddings from "../embeddings.js";
import type * as folders from "../folders.js";
import type * as init from "../init.js";
import type * as memory from "../memory.js";
import type * as myFunctions from "../myFunctions.js";
import type * as planningConversations from "../planningConversations.js";
import type * as projects from "../projects.js";
import type * as realtimeConversations from "../realtimeConversations.js";
import type * as search from "../search.js";
import type * as spoonos from "../spoonos.js";
import type * as todos from "../todos.js";
import type * as voice from "../voice.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bookmarks: typeof bookmarks;
  chat: typeof chat;
  chatMessages: typeof chatMessages;
  embeddings: typeof embeddings;
  folders: typeof folders;
  init: typeof init;
  memory: typeof memory;
  myFunctions: typeof myFunctions;
  planningConversations: typeof planningConversations;
  projects: typeof projects;
  realtimeConversations: typeof realtimeConversations;
  search: typeof search;
  spoonos: typeof spoonos;
  todos: typeof todos;
  voice: typeof voice;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
