import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const listByRegion = query({
  args: { region: v.optional(v.string()) },
  handler: async (ctx, { region }) => {
    if (region) {
      return await ctx.db
        .query("helplines")
        .withIndex("by_region", (q) => q.eq("region", region))
        .collect();
    }
    return await ctx.db.query("helplines").collect();
  },
});

/** Idempotent seed: skips rows if helplines table is non-empty. */
export const seedHelplinesOnce = internalMutation({
  args: {},
  handler: async (ctx) => {
    const any = await ctx.db.query("helplines").first();
    if (any) {
      return { inserted: 0, skipped: true as const };
    }
    const helplines = [
      {
        name: "iCall (TISS)",
        number: "9152987821",
        region: "national",
        type: "mental_health",
        available: "Mon-Sat 8am-10pm",
        language: ["en", "hi"],
      },
      {
        name: "Vandrevala Foundation",
        number: "18602662345",
        region: "national",
        type: "crisis",
        available: "24/7",
        language: ["en", "hi"],
      },
      {
        name: "NIMHANS",
        number: "08046110007",
        region: "national",
        type: "mental_health",
        available: "24/7",
        language: ["en", "hi", "kn"],
      },
      {
        name: "Snehi",
        number: "04424640050",
        region: "national",
        type: "crisis",
        available: "24/7",
        language: ["en", "hi"],
      },
      {
        name: "J&K Health Helpline",
        number: "104",
        region: "JK",
        type: "general",
        available: "24/7",
        language: ["en", "hi", "ur"],
      },
    ];
    for (const h of helplines) {
      await ctx.db.insert("helplines", h);
    }
    return { inserted: helplines.length, skipped: false as const };
  },
});
