/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents_crisisAgent from "../agents/crisisAgent.js";
import type * as agents_empathyAgent from "../agents/empathyAgent.js";
import type * as agents_extraction from "../agents/extraction.js";
import type * as agents_moodAgent from "../agents/moodAgent.js";
import type * as agents_resourceAgent from "../agents/resourceAgent.js";
import type * as agents_screeningAgent from "../agents/screeningAgent.js";
import type * as agents_supervisor from "../agents/supervisor.js";
import type * as agents_types from "../agents/types.js";
import type * as chatbotNode from "../chatbotNode.js";
import type * as counsellors from "../counsellors.js";
import type * as helplines from "../helplines.js";
import type * as hospitalsNode from "../hospitalsNode.js";
import type * as http from "../http.js";
import type * as jwtNode from "../jwtNode.js";
import type * as lib_hospitalMap from "../lib/hospitalMap.js";
import type * as lib_llm from "../lib/llm.js";
import type * as lib_search from "../lib/search.js";
import type * as patientChat from "../patientChat.js";
import type * as patients from "../patients.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as stickyNotes from "../stickyNotes.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "agents/crisisAgent": typeof agents_crisisAgent;
  "agents/empathyAgent": typeof agents_empathyAgent;
  "agents/extraction": typeof agents_extraction;
  "agents/moodAgent": typeof agents_moodAgent;
  "agents/resourceAgent": typeof agents_resourceAgent;
  "agents/screeningAgent": typeof agents_screeningAgent;
  "agents/supervisor": typeof agents_supervisor;
  "agents/types": typeof agents_types;
  chatbotNode: typeof chatbotNode;
  counsellors: typeof counsellors;
  helplines: typeof helplines;
  hospitalsNode: typeof hospitalsNode;
  http: typeof http;
  jwtNode: typeof jwtNode;
  "lib/hospitalMap": typeof lib_hospitalMap;
  "lib/llm": typeof lib_llm;
  "lib/search": typeof lib_search;
  patientChat: typeof patientChat;
  patients: typeof patients;
  seed: typeof seed;
  sessions: typeof sessions;
  stickyNotes: typeof stickyNotes;
  users: typeof users;
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
