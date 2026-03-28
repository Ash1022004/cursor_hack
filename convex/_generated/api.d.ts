/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminCounsellors from "../adminCounsellors.js";
import type * as agents_extraction from "../agents/extraction.js";
import type * as agents_types from "../agents/types.js";
import type * as chatbotNode from "../chatbotNode.js";
import type * as counsellors from "../counsellors.js";
import type * as dashboard from "../dashboard.js";
import type * as doctorsNode from "../doctorsNode.js";
import type * as guestAppointments from "../guestAppointments.js";
import type * as helplines from "../helplines.js";
import type * as hospitalsNode from "../hospitalsNode.js";
import type * as http from "../http.js";
import type * as http_common from "../http/common.js";
import type * as http_registerAll from "../http/registerAll.js";
import type * as http_routes_adminCounsellorHttpRoutes from "../http/routes/adminCounsellorHttpRoutes.js";
import type * as http_routes_adminUserRoutes from "../http/routes/adminUserRoutes.js";
import type * as http_routes_authRoutes from "../http/routes/authRoutes.js";
import type * as http_routes_chatbotRoutes from "../http/routes/chatbotRoutes.js";
import type * as http_routes_counsellorHttpRoutes from "../http/routes/counsellorHttpRoutes.js";
import type * as http_routes_health from "../http/routes/health.js";
import type * as http_routes_stickyNotesRoutes from "../http/routes/stickyNotesRoutes.js";
import type * as http_routes_userChatRoutes from "../http/routes/userChatRoutes.js";
import type * as jwtNode from "../jwtNode.js";
import type * as lib_anonymousId from "../lib/anonymousId.js";
import type * as lib_apifyRest from "../lib/apifyRest.js";
import type * as lib_chatAgentGraph from "../lib/chatAgentGraph.js";
import type * as lib_chatTrace from "../lib/chatTrace.js";
import type * as lib_hospitalMap from "../lib/hospitalMap.js";
import type * as lib_llm from "../lib/llm.js";
import type * as lib_search from "../lib/search.js";
import type * as lib_staffAuth from "../lib/staffAuth.js";
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
  adminCounsellors: typeof adminCounsellors;
  "agents/extraction": typeof agents_extraction;
  "agents/types": typeof agents_types;
  chatbotNode: typeof chatbotNode;
  counsellors: typeof counsellors;
  dashboard: typeof dashboard;
  doctorsNode: typeof doctorsNode;
  guestAppointments: typeof guestAppointments;
  helplines: typeof helplines;
  hospitalsNode: typeof hospitalsNode;
  http: typeof http;
  "http/common": typeof http_common;
  "http/registerAll": typeof http_registerAll;
  "http/routes/adminCounsellorHttpRoutes": typeof http_routes_adminCounsellorHttpRoutes;
  "http/routes/adminUserRoutes": typeof http_routes_adminUserRoutes;
  "http/routes/authRoutes": typeof http_routes_authRoutes;
  "http/routes/chatbotRoutes": typeof http_routes_chatbotRoutes;
  "http/routes/counsellorHttpRoutes": typeof http_routes_counsellorHttpRoutes;
  "http/routes/health": typeof http_routes_health;
  "http/routes/stickyNotesRoutes": typeof http_routes_stickyNotesRoutes;
  "http/routes/userChatRoutes": typeof http_routes_userChatRoutes;
  jwtNode: typeof jwtNode;
  "lib/anonymousId": typeof lib_anonymousId;
  "lib/apifyRest": typeof lib_apifyRest;
  "lib/chatAgentGraph": typeof lib_chatAgentGraph;
  "lib/chatTrace": typeof lib_chatTrace;
  "lib/hospitalMap": typeof lib_hospitalMap;
  "lib/llm": typeof lib_llm;
  "lib/search": typeof lib_search;
  "lib/staffAuth": typeof lib_staffAuth;
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
