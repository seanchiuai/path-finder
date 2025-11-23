/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actionPlans from "../actionPlans.js";
import type * as agentRuns from "../agentRuns.js";
import type * as careerFolders from "../careerFolders.js";
import type * as careerProfiles from "../careerProfiles.js";
import type * as careerProjects from "../careerProjects.js";
import type * as careerRecommendations from "../careerRecommendations.js";
import type * as chat from "../chat.js";
import type * as chatMessages from "../chatMessages.js";
import type * as embeddings from "../embeddings.js";
import type * as init from "../init.js";
import type * as memory from "../memory.js";
import type * as planningConversations from "../planningConversations.js";
import type * as realtimeConversations from "../realtimeConversations.js";
import type * as resources from "../resources.js";
import type * as salaryDataPoints from "../salaryDataPoints.js";
import type * as savedCareers from "../savedCareers.js";
import type * as search from "../search.js";
import type * as spoonos from "../spoonos.js";
import type * as userProfiles from "../userProfiles.js";
import type * as voice from "../voice.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actionPlans: typeof actionPlans;
  agentRuns: typeof agentRuns;
  careerFolders: typeof careerFolders;
  careerProfiles: typeof careerProfiles;
  careerProjects: typeof careerProjects;
  careerRecommendations: typeof careerRecommendations;
  chat: typeof chat;
  chatMessages: typeof chatMessages;
  embeddings: typeof embeddings;
  init: typeof init;
  memory: typeof memory;
  planningConversations: typeof planningConversations;
  realtimeConversations: typeof realtimeConversations;
  resources: typeof resources;
  salaryDataPoints: typeof salaryDataPoints;
  savedCareers: typeof savedCareers;
  search: typeof search;
  spoonos: typeof spoonos;
  userProfiles: typeof userProfiles;
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
