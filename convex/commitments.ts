import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const getPendingForPatient = internalQuery({
  args: { patientId: v.id("patients") },
  handler: async (ctx, { patientId }) => {
    const all = await ctx.db
      .query("commitments")
      .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
      .collect();
    return all.filter((c) => c.status === "pending");
  },
});

export const createCommitments = internalMutation({
  args: { patientId: v.id("patients"), texts: v.array(v.string()) },
  handler: async (ctx, { patientId, texts }) => {
    const now = Date.now();
    for (const text of texts) {
      await ctx.db.insert("commitments", {
        patientId,
        text,
        detectedAt: now,
        status: "pending",
      });
    }
  },
});

export const markFollowedUp = internalMutation({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, { commitmentId }) => {
    await ctx.db.patch(commitmentId, {
      status: "followed_up",
      followedUpAt: Date.now(),
    });
  },
});
