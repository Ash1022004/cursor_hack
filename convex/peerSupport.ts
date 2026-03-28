import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
} from "./_generated/server";
import type { DataModel, Id } from "./_generated/dataModel";

type ReadCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
type WriteCtx = GenericMutationCtx<DataModel>;

const DEFAULT_VISIBILITY = "off" as const;

function orderedPair(
  a: Id<"users">,
  b: Id<"users">
): { userMin: Id<"users">; userMax: Id<"users"> } {
  const sa = a as string;
  const sb = b as string;
  if (sa <= sb) return { userMin: a, userMax: b };
  return { userMin: b, userMax: a };
}

async function assertStudent(ctx: ReadCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || (user as { role: string }).role !== "student") {
    throw new Error("not_student");
  }
}

async function isBlocked(
  ctx: ReadCtx,
  a: Id<"users">,
  b: Id<"users">
): Promise<boolean> {
  const r1 = await ctx.db
    .query("peerBlocks")
    .withIndex("by_pair", (q) =>
      q.eq("blockerUserId", a).eq("blockedUserId", b)
    )
    .unique();
  if (r1) return true;
  const r2 = await ctx.db
    .query("peerBlocks")
    .withIndex("by_pair", (q) =>
      q.eq("blockerUserId", b).eq("blockedUserId", a)
    )
    .unique();
  return Boolean(r2);
}

export const getSettingsInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const row = await ctx.db
      .query("peerSupportSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!row) {
      return {
        visibility: DEFAULT_VISIBILITY,
        peerDisplayName: undefined as string | undefined,
        peerTopics: [] as string[],
        peerBio: undefined as string | undefined,
        updatedAt: 0,
      };
    }
    return {
      visibility: row.visibility,
      peerDisplayName: row.peerDisplayName,
      peerTopics: row.peerTopics,
      peerBio: row.peerBio,
      updatedAt: row.updatedAt,
    };
  },
});

export const updateSettingsInternal = internalMutation({
  args: {
    userId: v.id("users"),
    visibility: v.union(
      v.literal("off"),
      v.literal("private"),
      v.literal("open")
    ),
    peerDisplayName: v.optional(v.string()),
    peerTopics: v.optional(v.array(v.string())),
    peerBio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertStudent(ctx, args.userId);
    const now = Date.now();
    const existing = await ctx.db
      .query("peerSupportSettings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    const peerTopics = args.peerTopics ?? existing?.peerTopics ?? [];
    const peerDisplayName = args.peerDisplayName ?? existing?.peerDisplayName;
    const peerBio = args.peerBio ?? existing?.peerBio;
    if (existing) {
      await ctx.db.patch(existing._id, {
        visibility: args.visibility,
        peerDisplayName,
        peerTopics,
        peerBio,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("peerSupportSettings", {
        userId: args.userId,
        visibility: args.visibility,
        peerDisplayName,
        peerTopics,
        peerBio,
        updatedAt: now,
      });
    }
    return { ok: true as const };
  },
});

export const listDirectoryInternal = internalQuery({
  args: { viewerId: v.id("users") },
  handler: async (ctx, { viewerId }) => {
    await assertStudent(ctx, viewerId);
    const openRows = await ctx.db
      .query("peerSupportSettings")
      .withIndex("by_visibility", (q) => q.eq("visibility", "open"))
      .collect();
    const out: {
      userId: Id<"users">;
      peerDisplayName?: string;
      peerTopics: string[];
      ageGroup?: string;
      university?: string;
    }[] = [];
    for (const row of openRows) {
      if (row.userId === viewerId) continue;
      if (await isBlocked(ctx, viewerId, row.userId)) continue;
      const u = await ctx.db.get(row.userId);
      if (!u || (u as { role: string }).role !== "student") continue;
      const safe = u as {
        ageGroup?: string;
        university?: string;
      };
      out.push({
        userId: row.userId,
        peerDisplayName: row.peerDisplayName,
        peerTopics: row.peerTopics,
        ageGroup: safe.ageGroup,
        university: safe.university,
      });
    }
    return out;
  },
});

async function findPendingBetween(ctx: ReadCtx, a: Id<"users">, b: Id<"users">) {
  const ab = await ctx.db
    .query("peerConnectionRequests")
    .withIndex("by_pair", (q) =>
      q.eq("fromUserId", a).eq("toUserId", b)
    )
    .collect();
  const ba = await ctx.db
    .query("peerConnectionRequests")
    .withIndex("by_pair", (q) =>
      q.eq("fromUserId", b).eq("toUserId", a)
    )
    .collect();
  return [...ab, ...ba].filter((r) => r.status === "pending");
}

async function hasAcceptedConnection(
  ctx: ReadCtx,
  a: Id<"users">,
  b: Id<"users">
): Promise<boolean> {
  const ab = await ctx.db
    .query("peerConnectionRequests")
    .withIndex("by_pair", (q) =>
      q.eq("fromUserId", a).eq("toUserId", b)
    )
    .collect();
  const ba = await ctx.db
    .query("peerConnectionRequests")
    .withIndex("by_pair", (q) =>
      q.eq("fromUserId", b).eq("toUserId", a)
    )
    .collect();
  return [...ab, ...ba].some((r) => r.status === "accepted");
}

export const sendRequestInternal = internalMutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
  },
  handler: async (ctx, { fromUserId, toUserId }) => {
    if (fromUserId === toUserId) throw new Error("self");
    await assertStudent(ctx, fromUserId);
    await assertStudent(ctx, toUserId);
    if (await isBlocked(ctx, fromUserId, toUserId)) throw new Error("blocked");
    const targetRow = await ctx.db
      .query("peerSupportSettings")
      .withIndex("by_userId", (q) => q.eq("userId", toUserId))
      .unique();
    const targetVisibility = targetRow?.visibility ?? DEFAULT_VISIBILITY;
    if (targetVisibility === "off") throw new Error("target_off");
    const pending = await findPendingBetween(ctx, fromUserId, toUserId);
    if (pending.length > 0) {
      const sameOutgoing = pending.find(
        (r) => r.fromUserId === fromUserId && r.toUserId === toUserId
      );
      if (sameOutgoing) {
        return {
          ok: true as const,
          requestId: sameOutgoing._id,
          reused: true as const,
        };
      }
      const theyRequestedYou = pending.find(
        (r) => r.fromUserId === toUserId && r.toUserId === fromUserId
      );
      if (theyRequestedYou) {
        throw new Error("pending_incoming");
      }
    }
    if (await hasAcceptedConnection(ctx, fromUserId, toUserId)) {
      throw new Error("already_connected");
    }
    const now = Date.now();
    const id = await ctx.db.insert("peerConnectionRequests", {
      fromUserId,
      toUserId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true as const, requestId: id, reused: false as const };
  },
});

export const listIncomingRequestsInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await assertStudent(ctx, userId);
    const rows = await ctx.db
      .query("peerConnectionRequests")
      .withIndex("by_toUserId", (q) => q.eq("toUserId", userId))
      .collect();
    const pending = rows.filter((r) => r.status === "pending");
    const out = [];
    for (const r of pending) {
      if (await isBlocked(ctx, userId, r.fromUserId)) continue;
      const from = await ctx.db.get(r.fromUserId);
      if (!from) continue;
      const f = from as {
        firstName: string;
        lastName: string;
        university?: string;
      };
      out.push({
        requestId: r._id,
        fromUserId: r.fromUserId,
        fromLabel: `${f.firstName} ${f.lastName}`.trim(),
        createdAt: r.createdAt,
      });
    }
    return out;
  },
});

export const listOutgoingRequestsInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await assertStudent(ctx, userId);
    const rows = await ctx.db
      .query("peerConnectionRequests")
      .withIndex("by_fromUserId", (q) => q.eq("fromUserId", userId))
      .collect();
    const pending = rows.filter((r) => r.status === "pending");
    const out = [];
    for (const r of pending) {
      const to = await ctx.db.get(r.toUserId);
      if (!to) continue;
      const t = to as { firstName: string; lastName: string };
      out.push({
        requestId: r._id,
        toUserId: r.toUserId,
        toLabel: `${t.firstName} ${t.lastName}`.trim(),
        createdAt: r.createdAt,
      });
    }
    return out;
  },
});

async function getOrCreateConversation(
  ctx: WriteCtx,
  a: Id<"users">,
  b: Id<"users">
): Promise<Id<"peerConversations">> {
  const { userMin, userMax } = orderedPair(a, b);
  const existing = await ctx.db
    .query("peerConversations")
    .withIndex("by_pair", (q) =>
      q.eq("userMin", userMin).eq("userMax", userMax)
    )
    .unique();
  if (existing) return existing._id;
  const now = Date.now();
  return await ctx.db.insert("peerConversations", {
    userMin,
    userMax,
    createdAt: now,
    lastMessageAt: now,
  });
}

export const acceptRequestInternal = internalMutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("peerConnectionRequests"),
  },
  handler: async (ctx, { userId, requestId }) => {
    await assertStudent(ctx, userId);
    const req = await ctx.db.get(requestId);
    if (!req || req.toUserId !== userId) throw new Error("forbidden");
    if (req.status !== "pending") throw new Error("not_pending");
    const now = Date.now();
    await ctx.db.patch(requestId, {
      status: "accepted",
      updatedAt: now,
    });
    const convId = await getOrCreateConversation(
      ctx,
      req.fromUserId,
      req.toUserId
    );
    return { ok: true as const, conversationId: convId };
  },
});

export const rejectRequestInternal = internalMutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("peerConnectionRequests"),
  },
  handler: async (ctx, { userId, requestId }) => {
    await assertStudent(ctx, userId);
    const req = await ctx.db.get(requestId);
    if (!req || req.toUserId !== userId) throw new Error("forbidden");
    if (req.status !== "pending") throw new Error("not_pending");
    await ctx.db.patch(requestId, {
      status: "rejected",
      updatedAt: Date.now(),
    });
    return { ok: true as const };
  },
});

export const cancelRequestInternal = internalMutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("peerConnectionRequests"),
  },
  handler: async (ctx, { userId, requestId }) => {
    await assertStudent(ctx, userId);
    const req = await ctx.db.get(requestId);
    if (!req || req.fromUserId !== userId) throw new Error("forbidden");
    if (req.status !== "pending") throw new Error("not_pending");
    await ctx.db.patch(requestId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
    return { ok: true as const };
  },
});

export const listConversationsInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await assertStudent(ctx, userId);
    const all = await ctx.db.query("peerConversations").collect();
    const mine = all.filter(
      (c) => c.userMin === userId || c.userMax === userId
    );
    mine.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    const out = [];
    for (const c of mine) {
      const otherId = c.userMin === userId ? c.userMax : c.userMin;
      if (await isBlocked(ctx, userId, otherId)) continue;
      const other = await ctx.db.get(otherId);
      const label = other
        ? `${(other as { firstName: string }).firstName} ${(other as { lastName: string }).lastName}`.trim()
        : "Peer";
      const lastMsg = await ctx.db
        .query("peerMessages")
        .withIndex("by_conversation_createdAt", (q) =>
          q.eq("conversationId", c._id)
        )
        .order("desc")
        .first();
      out.push({
        conversationId: c._id,
        otherUserId: otherId,
        otherLabel: label,
        lastMessageAt: c.lastMessageAt,
        preview: lastMsg ? lastMsg.body.slice(0, 120) : "",
      });
    }
    return out;
  },
});

export const getMessagesInternal = internalQuery({
  args: {
    userId: v.id("users"),
    conversationId: v.id("peerConversations"),
    limit: v.number(),
    beforeCreatedAt: v.optional(v.number()),
  },
  handler: async (ctx, { userId, conversationId, limit, beforeCreatedAt }) => {
    await assertStudent(ctx, userId);
    const conv = await ctx.db.get(conversationId);
    if (!conv || (conv.userMin !== userId && conv.userMax !== userId)) {
      throw new Error("forbidden");
    }
    if (await isBlocked(ctx, userId, conv.userMin === userId ? conv.userMax : conv.userMin)) {
      throw new Error("blocked");
    }
    const take = Math.min(Math.max(1, limit), 100);
    let q = ctx.db
      .query("peerMessages")
      .withIndex("by_conversation_createdAt", (q) =>
        q.eq("conversationId", conversationId)
      )
      .order("desc");
    const batch = await q.take(take * 2);
    const filtered = beforeCreatedAt
      ? batch.filter((m) => m.createdAt < beforeCreatedAt)
      : batch;
    const slice = filtered.slice(0, take);
    slice.reverse();
    return slice.map((m) => ({
      id: m._id,
      senderId: m.senderId,
      body: m.body,
      createdAt: m.createdAt,
      mine: m.senderId === userId,
    }));
  },
});

export const sendMessageInternal = internalMutation({
  args: {
    userId: v.id("users"),
    conversationId: v.id("peerConversations"),
    body: v.string(),
  },
  handler: async (ctx, { userId, conversationId, body }) => {
    const text = body.trim();
    if (!text) throw new Error("empty");
    if (text.length > 8000) throw new Error("too_long");
    await assertStudent(ctx, userId);
    const conv = await ctx.db.get(conversationId);
    if (!conv || (conv.userMin !== userId && conv.userMax !== userId)) {
      throw new Error("forbidden");
    }
    const other = conv.userMin === userId ? conv.userMax : conv.userMin;
    if (await isBlocked(ctx, userId, other)) throw new Error("blocked");
    const ok = await hasAcceptedConnection(ctx, userId, other);
    if (!ok) throw new Error("not_connected");
    const now = Date.now();
    await ctx.db.insert("peerMessages", {
      conversationId,
      senderId: userId,
      body: text,
      createdAt: now,
    });
    await ctx.db.patch(conversationId, { lastMessageAt: now });
    return { ok: true as const, createdAt: now };
  },
});

/** Returns existing 1:1 thread when the pair has an accepted connection. */
export const ensureConversationInternal = internalMutation({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, { userId, otherUserId }) => {
    if (userId === otherUserId) throw new Error("self");
    await assertStudent(ctx, userId);
    await assertStudent(ctx, otherUserId);
    if (await isBlocked(ctx, userId, otherUserId)) throw new Error("blocked");
    if (!(await hasAcceptedConnection(ctx, userId, otherUserId))) {
      throw new Error("not_connected");
    }
    const conversationId = await getOrCreateConversation(
      ctx,
      userId,
      otherUserId
    );
    return { ok: true as const, conversationId };
  },
});

export const blockUserInternal = internalMutation({
  args: {
    blockerUserId: v.id("users"),
    blockedUserId: v.id("users"),
  },
  handler: async (ctx, { blockerUserId, blockedUserId }) => {
    if (blockerUserId === blockedUserId) throw new Error("self");
    await assertStudent(ctx, blockerUserId);
    await assertStudent(ctx, blockedUserId);
    const existing = await ctx.db
      .query("peerBlocks")
      .withIndex("by_pair", (q) =>
        q.eq("blockerUserId", blockerUserId).eq("blockedUserId", blockedUserId)
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("peerBlocks", {
        blockerUserId,
        blockedUserId,
        createdAt: Date.now(),
      });
    }
    return { ok: true as const };
  },
});
