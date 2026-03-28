import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

/** List all distinct topics that have cached resources. */
export const listTopics = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("resources").collect();
    const topics = new Set<string>();
    for (const r of all) topics.add(r.topic);
    return [...topics].sort();
  },
});

/** Get cached resources for a specific topic (internal — used by searchResources action). */
export const getByTopic = internalQuery({
  args: { topic: v.string() },
  handler: async (ctx, { topic }) => {
    const normalized = topic.toLowerCase().trim().replace(/\s+/g, " ");
    return await ctx.db
      .query("resources")
      .withIndex("by_topic", (q) => q.eq("topic", normalized))
      .collect();
  },
});

/** Upsert resources for a topic — deletes old, inserts fresh. */
export const upsertResources = internalMutation({
  args: {
    topic: v.string(),
    items: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        snippet: v.string(),
        source: v.string(),
      })
    ),
  },
  handler: async (ctx, { topic, items }) => {
    // Remove old entries for this topic
    const existing = await ctx.db
      .query("resources")
      .withIndex("by_topic", (q) => q.eq("topic", topic))
      .collect();
    for (const old of existing) {
      await ctx.db.delete(old._id);
    }

    // Insert fresh
    const now = Date.now();
    for (const item of items) {
      // Skip duplicates by URL within same batch
      const dup = await ctx.db
        .query("resources")
        .withIndex("by_url", (q) => q.eq("url", item.url))
        .first();
      if (dup) continue;

      await ctx.db.insert("resources", {
        topic,
        title: item.title,
        url: item.url,
        snippet: item.snippet,
        source: item.source,
        language: "en",
        tags: topic.split(" "),
        fetchedAt: now,
      });
    }
  },
});
