import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { assertValidAnonymousId } from "./lib/anonymousId";

export const getOrCreatePatient = mutation({
  args: { anonymousId: v.string(), language: v.optional(v.string()) },
  handler: async (ctx, { anonymousId, language }) => {
    assertValidAnonymousId(anonymousId);
    const existing = await ctx.db
      .query("patients")
      .withIndex("by_anonymousId", (q) => q.eq("anonymousId", anonymousId))
      .first();
    if (existing) {
      const patch: Record<string, unknown> = { lastSeen: Date.now() };
      if (language) patch.language = language;
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    const id = await ctx.db.insert("patients", {
      anonymousId,
      conditions: [],
      medications: [],
      triggers: [],
      copingPatterns: [],
      crisisFlag: false,
      totalSessions: 0,
      lastSeen: Date.now(),
      language: language ?? "en",
    });
    return id;
  },
});

export const getProfileByAnonymousId = query({
  args: { anonymousId: v.string() },
  handler: async (ctx, { anonymousId }) => {
    assertValidAnonymousId(anonymousId);
    return await ctx.db
      .query("patients")
      .withIndex("by_anonymousId", (q) => q.eq("anonymousId", anonymousId))
      .first();
  },
});

export const getByAnonymousId = internalQuery({
  args: { anonymousId: v.string() },
  handler: async (ctx, { anonymousId }) => {
    return await ctx.db
      .query("patients")
      .withIndex("by_anonymousId", (q) => q.eq("anonymousId", anonymousId))
      .first();
  },
});

export const createPatientInternal = internalMutation({
  args: { anonymousId: v.string(), language: v.optional(v.string()) },
  handler: async (ctx, { anonymousId, language }) => {
    const existing = await ctx.db
      .query("patients")
      .withIndex("by_anonymousId", (q) => q.eq("anonymousId", anonymousId))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("patients", {
      anonymousId,
      conditions: [],
      medications: [],
      triggers: [],
      copingPatterns: [],
      crisisFlag: false,
      totalSessions: 0,
      lastSeen: Date.now(),
      language: language ?? "en",
    });
  },
});

export const updateFromExtraction = internalMutation({
  args: {
    patientId: v.id("patients"),
    conditions: v.array(v.string()),
    medications: v.array(v.string()),
    triggers: v.array(v.string()),
    copingPatterns: v.array(v.string()),
    commitments: v.optional(v.array(v.string())),
    crisisSignal: v.boolean(),
    moodScore: v.number(),
    dominantEmotion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    if (!patient) return;

    const merge = (existing: string[], incoming: string[]) =>
      [...new Set([...existing, ...incoming])];

    await ctx.db.patch(args.patientId, {
      conditions: merge(patient.conditions, args.conditions),
      medications: merge(patient.medications, args.medications),
      triggers: merge(patient.triggers, args.triggers),
      copingPatterns: merge(patient.copingPatterns, args.copingPatterns),
      crisisFlag: args.crisisSignal || patient.crisisFlag,
      lastSeen: Date.now(),
    });

    // Always log mood for every message to power the sparkline chart
    if (args.moodScore >= 1 && args.moodScore <= 10) {
      await ctx.db.insert("moodLogs", {
        patientId: args.patientId,
        score: args.moodScore,
        emotion: args.dominantEmotion ?? "inferred",
        triggers: args.triggers,
        date: Date.now(),
      });
    }

    // Save commitments
    if (args.commitments && args.commitments.length > 0) {
      const now = Date.now();
      for (const text of args.commitments) {
        await ctx.db.insert("commitments", {
          patientId: args.patientId,
          text,
          detectedAt: now,
          status: "pending",
        });
      }
    }
  },
});

export const incrementSessions = internalMutation({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    const p = await ctx.db.get(patientId);
    if (!p) return;
    await ctx.db.patch(patientId, {
      totalSessions: p.totalSessions + 1,
      lastSeen: Date.now(),
    });
  },
});
