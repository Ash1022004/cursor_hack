import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const getUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const listForPatient = query({
  args: { anonymousId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { anonymousId, limit }) => {
    const patient = await ctx.db
      .query("patients")
      .withIndex("by_anonymousId", (q) => q.eq("anonymousId", anonymousId))
      .first();
    if (!patient) return [];
    const cap = Math.min(limit ?? 10, 30);
    const journals = await ctx.db
      .query("voiceJournals")
      .withIndex("by_patientId", (q) => q.eq("patientId", patient._id))
      .order("desc")
      .take(cap);
    return journals.map((j) => ({
      _id: j._id,
      transcription: j.transcription,
      summary: j.summary,
      moodScore: j.moodScore,
      emotion: j.emotion,
      duration: j.duration,
      createdAt: j.createdAt,
    }));
  },
});

export const saveJournal = internalMutation({
  args: {
    patientId: v.id("patients"),
    storageId: v.id("_storage"),
    duration: v.number(),
    transcription: v.optional(v.string()),
    summary: v.optional(v.string()),
    moodScore: v.optional(v.number()),
    emotion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("voiceJournals", {
      patientId: args.patientId,
      storageId: args.storageId,
      transcription: args.transcription,
      summary: args.summary,
      moodScore: args.moodScore,
      emotion: args.emotion,
      duration: args.duration,
      createdAt: Date.now(),
    });
  },
});

export const updateJournal = internalMutation({
  args: {
    journalId: v.id("voiceJournals"),
    transcription: v.optional(v.string()),
    summary: v.optional(v.string()),
    moodScore: v.optional(v.number()),
    emotion: v.optional(v.string()),
  },
  handler: async (ctx, { journalId, ...fields }) => {
    const patch: Record<string, unknown> = {};
    if (fields.transcription !== undefined)
      patch.transcription = fields.transcription;
    if (fields.summary !== undefined) patch.summary = fields.summary;
    if (fields.moodScore !== undefined) patch.moodScore = fields.moodScore;
    if (fields.emotion !== undefined) patch.emotion = fields.emotion;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(journalId, patch);
    }
  },
});
