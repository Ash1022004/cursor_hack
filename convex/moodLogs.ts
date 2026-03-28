import { v } from "convex/values";
import { query } from "./_generated/server";

export const getRecentForPatient = query({
  args: { anonymousId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { anonymousId, limit }) => {
    const patient = await ctx.db
      .query("patients")
      .withIndex("by_anonymousId", (q) => q.eq("anonymousId", anonymousId))
      .first();
    if (!patient) return [];
    const cap = Math.min(limit ?? 20, 50);
    const logs = await ctx.db
      .query("moodLogs")
      .withIndex("by_patientId", (q) => q.eq("patientId", patient._id))
      .order("desc")
      .take(cap);
    // Return oldest-first for sparkline rendering
    return logs.reverse().map((l) => ({
      score: l.score,
      emotion: l.emotion,
      date: l.date,
    }));
  },
});
