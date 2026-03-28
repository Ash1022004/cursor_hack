import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import { internalMutation, internalQuery, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

/**
 * Apify / CSV / manual import: each item matches `medicineFields` below.
 * Example: { "name": "...", "genericNames": ["..."], "uses", "dosage", "sideEffects", "precautions", "source": "apify" }
 */

const medicineFields = v.object({
  name: v.string(),
  genericNames: v.array(v.string()),
  uses: v.string(),
  dosage: v.string(),
  sideEffects: v.string(),
  precautions: v.string(),
  source: v.optional(v.string()),
});

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function buildSearchBlob(name: string, genericNames: string[]): string {
  return [name, ...genericNames].join(" ").toLowerCase();
}

async function searchMedicinesImpl(
  ctx: QueryCtx,
  q: string
): Promise<Doc<"medicines">[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const search = await ctx.db
    .query("medicines")
    .withSearchIndex("search_medicine", (s) => s.search("searchBlob", trimmed))
    .take(20);

  if (search.length > 0) return search;

  const all = await ctx.db.query("medicines").collect();
  const lower = trimmed.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 1);
  return all.filter((m) => {
    const pool = buildSearchBlob(m.name, m.genericNames);
    if (pool.includes(lower)) return true;
    return words.every((w) => pool.includes(w));
  });
}

/** Batch upsert for CLI seed: `npx convex run internal/medicinesDb:seedBatch '{"items":[...]}'` */
export const seedBatch = internalMutation({
  args: { items: v.array(medicineFields) },
  handler: async (ctx, { items }) => {
    const now = Date.now();
    for (const item of items) {
      const nameNormalized = normalizeName(item.name);
      const searchBlob = buildSearchBlob(item.name, item.genericNames);
      const existing = await ctx.db
        .query("medicines")
        .withIndex("by_name_normalized", (q) =>
          q.eq("nameNormalized", nameNormalized)
        )
        .first();
      const row = {
        name: item.name.trim(),
        nameNormalized,
        genericNames: item.genericNames,
        uses: item.uses,
        dosage: item.dosage,
        sideEffects: item.sideEffects,
        precautions: item.precautions,
        source: item.source ?? "seed",
        updatedAt: now,
        searchBlob,
      };
      if (existing) {
        await ctx.db.patch(existing._id, row);
      } else {
        await ctx.db.insert("medicines", row);
      }
    }
    return { upserted: items.length };
  },
});

export const searchMedicines = internalQuery({
  args: { q: v.string() },
  handler: async (ctx, { q }) => searchMedicinesImpl(ctx, q),
});

export const searchMedicinesPublic = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => searchMedicinesImpl(ctx, q),
});

export const matchBestMedicine = query({
  args: { extractedName: v.string() },
  handler: async (ctx, { extractedName }) => {
    const lower = extractedName.toLowerCase().trim();
    if (lower.length < 2) return null;

    const search = await searchMedicinesImpl(ctx, extractedName);
    if (search.length === 0) return null;
    if (search.length === 1) return search[0]!;

    let best: Doc<"medicines"> | null = null;
    let bestLen = 0;
    for (const m of search) {
      const names = [m.name, ...m.genericNames];
      for (const n of names) {
        const nl = n.toLowerCase();
        if (nl.length < 3) continue;
        if (lower.includes(nl) && nl.length > bestLen) {
          best = m;
          bestLen = nl.length;
        }
        if (nl.includes(lower) && lower.length > bestLen) {
          best = m;
          bestLen = lower.length;
        }
      }
    }
    return best;
  },
});
