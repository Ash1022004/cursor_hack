"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import Exa from "exa-js";

/* ── Constants ─────────────────────────────────────────────── */

const STALE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const RESOURCE_DOMAINS = [
  "healthline.com",
  "verywellmind.com",
  "psychologytoday.com",
  "mayoclinic.org",
  "who.int",
  "nimhans.ac.in",
  "mind.org.uk",
  "nhs.uk",
  "helpguide.org",
  "medlineplus.gov",
];

const SEED_TOPICS = [
  "depression",
  "anxiety",
  "exam stress",
  "sleep problems",
  "loneliness",
  "self-harm support",
  "grief and loss",
  "relationship issues",
  "anger management",
  "social anxiety",
  "panic attacks",
  "academic pressure",
  "homesickness",
  "body image",
  "substance abuse",
  "PTSD",
  "OCD",
  "eating disorders",
  "mindfulness techniques",
  "breathing exercises",
];

/* ── Helpers ───────────────────────────────────────────────── */

function normalizeTopic(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, " ");
}

async function fetchFromExa(
  topic: string
): Promise<
  { title: string; url: string; snippet: string; source: string }[]
> {
  const key = process.env.EXA_API_KEY;
  if (!key) return [];

  const exa = new Exa(key);
  const enriched = `${topic} mental health self-help resources`;

  try {
    const results = await exa.searchAndContents(enriched, {
      numResults: 6,
      highlights: true,
      includeDomains: RESOURCE_DOMAINS,
    });

    type ExaRow = {
      title?: string | null;
      url?: string;
      highlights?: string[];
      text?: string;
    };

    return (results.results ?? [])
      .map((r) => {
        const row = r as unknown as ExaRow;
        const highlight =
          row.highlights && typeof row.highlights[0] === "string"
            ? row.highlights[0]
            : "";
        const snippet =
          highlight ||
          (typeof row.text === "string" ? row.text.slice(0, 500) : "");
        return {
          title: row.title ?? row.url ?? "Resource",
          url: row.url ?? "",
          snippet,
          source: "exa" as const,
        };
      })
      .filter((r) => r.url);
  } catch {
    return [];
  }
}

/* ── Actions ───────────────────────────────────────────────── */

/**
 * Hybrid search: DB cache first, Exa fallback.
 * Used by both the /resources page and the chat agent tool.
 */
type ResourceResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  topic: string;
};

export const searchResources = action({
  args: { query: v.string() },
  handler: async (ctx, { query: rawQuery }): Promise<ResourceResult[]> => {
    const topic = normalizeTopic(rawQuery);
    if (!topic) return [];

    // 1. Check DB cache
    const cached = await ctx.runQuery(internal.resourcesDb.getByTopic, {
      topic,
    });

    type CachedResource = {
      title: string;
      url: string;
      snippet: string;
      source: string;
      topic: string;
      fetchedAt: number;
    };
    const toResult = (r: CachedResource) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      source: r.source,
      topic: r.topic,
    });

    if (cached.length > 0) {
      const newest = Math.max(
        ...cached.map((r: CachedResource) => r.fetchedAt)
      );
      if (Date.now() - newest < STALE_MS) {
        return cached.map(toResult);
      }
    }

    // 2. Fetch from Exa
    const fresh = await fetchFromExa(topic);
    if (fresh.length === 0 && cached.length > 0) {
      // Exa failed but we have stale cache — return stale
      return cached.map(toResult);
    }

    if (fresh.length > 0) {
      // 3. Persist to DB
      await ctx.runMutation(internal.resourcesDb.upsertResources, {
        topic,
        items: fresh,
      });
    }

    return fresh.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      source: r.source,
      topic,
    }));
  },
});

/**
 * Seed the resource DB with common mental health topics.
 * Run: npx convex run internal/resources:seedResources
 */
export const seedResources = internalAction({
  args: {},
  handler: async (ctx) => {
    let totalInserted = 0;

    for (const topic of SEED_TOPICS) {
      const normalized = normalizeTopic(topic);
      const items = await fetchFromExa(normalized);
      if (items.length > 0) {
        await ctx.runMutation(internal.resourcesDb.upsertResources, {
          topic: normalized,
          items,
        });
        totalInserted += items.length;
      }
      // Small delay to respect Exa rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    return { topics: SEED_TOPICS.length, totalInserted };
  },
});
