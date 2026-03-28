import type { HttpRouter } from "convex/server";
import { httpAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { json, verifyAuth } from "../common";

function requireStudent(auth: {
  userId: string;
  email: string;
  role: string;
} | null): Response | null {
  if (!auth) {
    return json({ success: false, message: "No token Provided" }, 401);
  }
  if (auth.role !== "student") {
    return json({ success: false, message: "Peer support is for students only" }, 403);
  }
  return null;
}

const PEER_ERROR_CODES = [
  "not_student",
  "forbidden",
  "blocked",
  "self",
  "target_off",
  "pending_exists",
  "pending_incoming",
  "already_connected",
  "not_pending",
  "empty",
  "too_long",
  "not_connected",
] as const;

function extractPeerErrorCode(raw: string): string {
  const trimmed = raw.trim();
  for (const code of PEER_ERROR_CODES) {
    if (trimmed === code || trimmed.includes(code)) return code;
  }
  return trimmed.slice(0, 240);
}

function mapPeerError(e: unknown): { status: number; code: string } {
  const raw = e instanceof Error ? e.message : String(e);
  const code = extractPeerErrorCode(raw);
  const statusMap: Record<string, number> = {
    not_student: 403,
    forbidden: 403,
    blocked: 403,
    self: 400,
    target_off: 400,
    pending_exists: 409,
    pending_incoming: 409,
    already_connected: 409,
    not_pending: 400,
    empty: 400,
    too_long: 400,
    not_connected: 403,
  };
  return { status: statusMap[code] ?? 500, code };
}

function asUserId(authUserId: string): Id<"users"> {
  return authUserId as Id<"users">;
}

export function registerPeerRoutes(http: HttpRouter): void {
  http.route({
    path: "/api/user/peer/settings",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      const settings = await ctx.runQuery(
        internal.peerSupport.getSettingsInternal,
        { userId: asUserId(auth!.userId) }
      );
      return json({ success: true, settings });
    }),
  });

  http.route({
    path: "/api/user/peer/settings",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      let body: Record<string, unknown> = {};
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ success: false, message: "Invalid JSON" }, 400);
      }
      const vis = body.visibility;
      if (vis !== "off" && vis !== "private" && vis !== "open") {
        return json(
          { success: false, message: "visibility must be off, private, or open" },
          400
        );
      }
      const peerDisplayName =
        typeof body.peerDisplayName === "string"
          ? body.peerDisplayName.slice(0, 80)
          : undefined;
      const peerBio =
        typeof body.peerBio === "string" ? body.peerBio.slice(0, 500) : undefined;
      let peerTopics: string[] | undefined;
      if (Array.isArray(body.peerTopics)) {
        peerTopics = body.peerTopics
          .filter((t) => typeof t === "string")
          .map((t) => t.slice(0, 64))
          .slice(0, 20);
      }
      try {
        await ctx.runMutation(internal.peerSupport.updateSettingsInternal, {
          userId: asUserId(auth!.userId),
          visibility: vis,
          peerDisplayName,
          peerTopics,
          peerBio,
        });
        const settings = await ctx.runQuery(
          internal.peerSupport.getSettingsInternal,
          { userId: asUserId(auth!.userId) }
        );
        return json({ success: true, settings });
      } catch (e) {
        const { status, code } = mapPeerError(e);
        return json({ success: false, message: code }, status);
      }
    }),
  });

  http.route({
    path: "/api/user/peer/directory",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      const peers = await ctx.runQuery(internal.peerSupport.listDirectoryInternal, {
        viewerId: asUserId(auth!.userId),
      });
      return json({ success: true, peers });
    }),
  });

  http.route({
    path: "/api/user/peer/requests",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      let body: Record<string, unknown> = {};
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ success: false, message: "Invalid JSON" }, 400);
      }
      const toUserId = typeof body.toUserId === "string" ? body.toUserId : "";
      if (!toUserId) {
        return json({ success: false, message: "toUserId is required" }, 400);
      }
      try {
        const result = await ctx.runMutation(
          internal.peerSupport.sendRequestInternal,
          {
            fromUserId: asUserId(auth!.userId),
            toUserId: toUserId as Id<"users">,
          }
        );
        return json(
          {
            success: true,
            requestId: result.requestId,
            reused: Boolean(result.reused),
          },
          result.reused ? 200 : 201
        );
      } catch (e) {
        const { status, code } = mapPeerError(e);
        return json({ success: false, message: code }, status);
      }
    }),
  });

  http.route({
    path: "/api/user/peer/requests/incoming",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      const requests = await ctx.runQuery(
        internal.peerSupport.listIncomingRequestsInternal,
        { userId: asUserId(auth!.userId) }
      );
      return json({ success: true, requests });
    }),
  });

  http.route({
    path: "/api/user/peer/requests/outgoing",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      const requests = await ctx.runQuery(
        internal.peerSupport.listOutgoingRequestsInternal,
        { userId: asUserId(auth!.userId) }
      );
      return json({ success: true, requests });
    }),
  });

  http.route({
    path: "/api/user/peer/requests/accept",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      let body: Record<string, unknown> = {};
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ success: false, message: "Invalid JSON" }, 400);
      }
      const requestId =
        typeof body.requestId === "string" ? body.requestId : "";
      if (!requestId) {
        return json({ success: false, message: "requestId is required" }, 400);
      }
      try {
        const result = await ctx.runMutation(
          internal.peerSupport.acceptRequestInternal,
          {
            userId: asUserId(auth!.userId),
            requestId: requestId as Id<"peerConnectionRequests">,
          }
        );
        return json({
          success: true,
          conversationId: result.conversationId,
        });
      } catch (e) {
        const { status, code } = mapPeerError(e);
        return json({ success: false, message: code }, status);
      }
    }),
  });

  http.route({
    path: "/api/user/peer/requests/reject",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      let body: Record<string, unknown> = {};
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ success: false, message: "Invalid JSON" }, 400);
      }
      const requestId =
        typeof body.requestId === "string" ? body.requestId : "";
      if (!requestId) {
        return json({ success: false, message: "requestId is required" }, 400);
      }
      try {
        await ctx.runMutation(internal.peerSupport.rejectRequestInternal, {
          userId: asUserId(auth!.userId),
          requestId: requestId as Id<"peerConnectionRequests">,
        });
        return json({ success: true });
      } catch (e) {
        const { status, code } = mapPeerError(e);
        return json({ success: false, message: code }, status);
      }
    }),
  });

  http.route({
    path: "/api/user/peer/requests/cancel",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      let body: Record<string, unknown> = {};
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ success: false, message: "Invalid JSON" }, 400);
      }
      const requestId =
        typeof body.requestId === "string" ? body.requestId : "";
      if (!requestId) {
        return json({ success: false, message: "requestId is required" }, 400);
      }
      try {
        await ctx.runMutation(internal.peerSupport.cancelRequestInternal, {
          userId: asUserId(auth!.userId),
          requestId: requestId as Id<"peerConnectionRequests">,
        });
        return json({ success: true });
      } catch (e) {
        const { status, code } = mapPeerError(e);
        return json({ success: false, message: code }, status);
      }
    }),
  });

  http.route({
    path: "/api/user/peer/conversations",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      const conversations = await ctx.runQuery(
        internal.peerSupport.listConversationsInternal,
        { userId: asUserId(auth!.userId) }
      );
      return json({ success: true, conversations });
    }),
  });

  http.route({
    path: "/api/user/peer/conversations",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      let body: Record<string, unknown> = {};
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ success: false, message: "Invalid JSON" }, 400);
      }
      const otherUserId =
        typeof body.otherUserId === "string" ? body.otherUserId : "";
      if (!otherUserId) {
        return json({ success: false, message: "otherUserId is required" }, 400);
      }
      try {
        const result = await ctx.runMutation(
          internal.peerSupport.ensureConversationInternal,
          {
            userId: asUserId(auth!.userId),
            otherUserId: otherUserId as Id<"users">,
          }
        );
        return json({ success: true, conversationId: result.conversationId });
      } catch (e) {
        const { status, code } = mapPeerError(e);
        return json({ success: false, message: code }, status);
      }
    }),
  });

  http.route({
    path: "/api/user/peer/messages",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      const url = new URL(request.url);
      const conversationId = url.searchParams.get("conversationId")?.trim() ?? "";
      if (!conversationId) {
        return json(
          { success: false, message: "conversationId query param is required" },
          400
        );
      }
      const limitRaw = url.searchParams.get("limit");
      const limit = limitRaw ? parseInt(limitRaw, 10) : 50;
      const beforeCreatedAtRaw = url.searchParams.get("beforeCreatedAt");
      const beforeCreatedAt = beforeCreatedAtRaw
        ? parseInt(beforeCreatedAtRaw, 10)
        : undefined;
      try {
        const messages = await ctx.runQuery(
          internal.peerSupport.getMessagesInternal,
          {
            userId: asUserId(auth!.userId),
            conversationId: conversationId as Id<"peerConversations">,
            limit: Number.isFinite(limit) ? limit : 50,
            beforeCreatedAt:
              beforeCreatedAt !== undefined && Number.isFinite(beforeCreatedAt)
                ? beforeCreatedAt
                : undefined,
          }
        );
        return json({ success: true, messages });
      } catch (e) {
        const { status, code } = mapPeerError(e);
        return json({ success: false, message: code }, status);
      }
    }),
  });

  http.route({
    path: "/api/user/peer/messages",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      let body: Record<string, unknown> = {};
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ success: false, message: "Invalid JSON" }, 400);
      }
      const conversationId =
        typeof body.conversationId === "string" ? body.conversationId : "";
      const text = typeof body.body === "string" ? body.body : "";
      if (!conversationId) {
        return json(
          { success: false, message: "conversationId is required" },
          400
        );
      }
      try {
        await ctx.runMutation(internal.peerSupport.sendMessageInternal, {
          userId: asUserId(auth!.userId),
          conversationId: conversationId as Id<"peerConversations">,
          body: text,
        });
        return json({ success: true });
      } catch (e) {
        const { status, code } = mapPeerError(e);
        return json({ success: false, message: code }, status);
      }
    }),
  });

  http.route({
    path: "/api/user/peer/block",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      const deny = requireStudent(auth);
      if (deny) return deny;
      let body: Record<string, unknown> = {};
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ success: false, message: "Invalid JSON" }, 400);
      }
      const blockedUserId =
        typeof body.blockedUserId === "string" ? body.blockedUserId : "";
      if (!blockedUserId) {
        return json(
          { success: false, message: "blockedUserId is required" },
          400
        );
      }
      try {
        await ctx.runMutation(internal.peerSupport.blockUserInternal, {
          blockerUserId: asUserId(auth!.userId),
          blockedUserId: blockedUserId as Id<"users">,
        });
        return json({ success: true });
      } catch (e) {
        const { status, code } = mapPeerError(e);
        return json({ success: false, message: code }, status);
      }
    }),
  });
}
