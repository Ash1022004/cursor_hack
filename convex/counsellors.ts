import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const ensureByClerkId = mutation({
  args: {
    clerkUserId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { clerkUserId, name, email }) => {
    const existing = await ctx.db
      .query("counsellors")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name,
        ...(email !== undefined ? { email } : {}),
      });
      return existing._id;
    }
    return await ctx.db.insert("counsellors", {
      clerkUserId,
      name,
      email: email ?? "",
      specialization: [],
      institution: "",
      available: true,
    });
  },
});

export const getByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    return await ctx.db
      .query("counsellors")
      .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
      .first();
  },
});
