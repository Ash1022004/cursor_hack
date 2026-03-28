import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Public booking form (same exposure as previous JSON file on disk). */
export const createGuest = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    department: v.string(),
    preferredDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const department = args.department.trim();
    const preferredDate = args.preferredDate.trim();
    if (!name || !email || !department || !preferredDate) {
      throw new Error("Missing required fields");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email");
    }
    const id = await ctx.db.insert("appointments", {
      guestName: name,
      guestEmail: email,
      guestPhone: args.phone?.trim(),
      department,
      preferredDate,
      notes: args.notes?.trim(),
      counsellorId: "",
      slot: Date.now(),
      aiSummary: "",
      status: "pending",
    });
    const doc = await ctx.db.get(id);
    return doc;
  },
});

export const assignCounsellor = mutation({
  args: {
    appointmentId: v.id("appointments"),
    counsellorId: v.string(),
  },
  handler: async (ctx, { appointmentId, counsellorId }) => {
    await ctx.db.patch(appointmentId, { counsellorId });
    return { ok: true };
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const n = Math.min(Math.max(limit ?? 100, 1), 200);
    return await ctx.db.query("appointments").order("desc").take(n);
  },
});
