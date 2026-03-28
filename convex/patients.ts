import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { assertValidAnonymousId, assertValidSubjectKey } from "./lib/anonymousId";

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
    assertValidSubjectKey(anonymousId);
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

const MEMORY_LIMIT = 2000;

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
    memoryFacts: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    if (!patient) return;

    const merge = (existing: string[], incoming: string[]) =>
      [...new Set([...existing, ...incoming])];

    // Append new memory facts as bullets, trimming oldest to stay within limit
    let memoryNote = patient.memoryNote ?? "";
    if (args.memoryFacts && args.memoryFacts.length > 0) {
      const bullets = args.memoryFacts.map((f) => `• ${f}`).join("\n") + "\n";
      memoryNote = memoryNote + bullets;
      if (memoryNote.length > MEMORY_LIMIT) {
        memoryNote = memoryNote.slice(memoryNote.length - MEMORY_LIMIT);
        // Snap to the start of the next bullet so we don't cut mid-sentence
        const firstBullet = memoryNote.indexOf("•");
        if (firstBullet > 0) memoryNote = memoryNote.slice(firstBullet);
      }
    }

    await ctx.db.patch(args.patientId, {
      conditions: merge(patient.conditions, args.conditions),
      medications: merge(patient.medications, args.medications),
      triggers: merge(patient.triggers, args.triggers),
      copingPatterns: merge(patient.copingPatterns, args.copingPatterns),
      crisisFlag: args.crisisSignal || patient.crisisFlag,
      lastSeen: Date.now(),
      ...(memoryNote !== (patient.memoryNote ?? "") ? { memoryNote: memoryNote || undefined } : {}),
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

/** User-facing: overwrite or clear the memory note (enforces 2000-char limit). */
export const updateMemory = mutation({
  args: { anonymousId: v.string(), memoryNote: v.string() },
  handler: async (ctx, { anonymousId, memoryNote }) => {
    assertValidSubjectKey(anonymousId);
    const patient = await ctx.db
      .query("patients")
      .withIndex("by_anonymousId", (q) => q.eq("anonymousId", anonymousId))
      .first();
    if (!patient) return;
    const trimmed = memoryNote.trim().slice(0, MEMORY_LIMIT);
    await ctx.db.patch(patient._id, {
      memoryNote: trimmed || undefined,
    });
  },
});
