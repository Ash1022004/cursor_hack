import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";

export const createSession = internalMutation({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    return await ctx.db.insert("sessions", {
      patientId,
      messages: [],
      startedAt: Date.now(),
    });
  },
});

export const getSession = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db.get(sessionId);
  },
});

export const getSessionForPatient = query({
  args: {
    anonymousId: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, { anonymousId, sessionId }) => {
    const patient = await ctx.db
      .query("patients")
      .withIndex("by_anonymousId", (q) => q.eq("anonymousId", anonymousId))
      .first();
    if (!patient) return null;
    const session = await ctx.db.get(sessionId);
    if (!session || session.patientId !== patient._id) return null;
    return session;
  },
});

export const addMessages = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    userMessage: v.string(),
    assistantMessage: v.string(),
    agentUsed: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;

    const now = Date.now();
    await ctx.db.patch(args.sessionId, {
      messages: [
        ...session.messages,
        { role: "user" as const, content: args.userMessage, timestamp: now },
        {
          role: "assistant" as const,
          content: args.assistantMessage,
          agentUsed: args.agentUsed,
          timestamp: now + 1,
        },
      ],
    });
  },
});

export const getPatientSessions = query({
  args: { anonymousId: v.string() },
  handler: async (ctx, { anonymousId }) => {
    const patient = await ctx.db
      .query("patients")
      .withIndex("by_anonymousId", (q) => q.eq("anonymousId", anonymousId))
      .first();
    if (!patient) return [];
    return await ctx.db
      .query("sessions")
      .withIndex("by_patientId", (q) => q.eq("patientId", patient._id))
      .order("desc")
      .take(10);
  },
});
