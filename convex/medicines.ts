"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import Exa from "exa-js";
import { chat } from "./lib/llm";
import type { Doc } from "./_generated/dataModel";

const MEDICINE_EXA_DOMAINS = [
  "medlineplus.gov",
  "mayoclinic.org",
  "who.int",
  "nih.gov",
  "cdsco.gov.in",
];

type ExaSnippet = { title: string; url: string; text: string };

async function exaSearchMedicine(query: string): Promise<ExaSnippet[]> {
  const key = process.env.EXA_API_KEY;
  if (!key) return [];
  const exa = new Exa(key);
  const enriched = `${query} drug medicine dosage side effects patient information`;
  try {
    const results = await exa.searchAndContents(enriched, {
      numResults: 5,
      highlights: true,
      text: { maxCharacters: 6000 },
      includeDomains: [...new Set(MEDICINE_EXA_DOMAINS)],
    });
    type ExaRow = {
      title?: string | null;
      url?: string;
      highlights?: string[];
      text?: string;
    };
    return (results.results ?? [])
      .map((r): ExaSnippet | null => {
        const row = r as unknown as ExaRow;
        const highlight =
          row.highlights && typeof row.highlights[0] === "string"
            ? row.highlights[0]
            : "";
        const body =
          typeof row.text === "string" && row.text.length > 0
            ? row.text.slice(0, 4000)
            : highlight;
        const url = row.url ?? "";
        if (!url || !body.trim()) return null;
        return {
          title: row.title ?? url,
          url,
          text: body,
        };
      })
      .filter((x): x is ExaSnippet => x !== null);
  } catch {
    return [];
  }
}

function parseExplainJson(raw: string): {
  name: string;
  genericNames: string[];
  uses: string;
  dosage: string;
  sideEffects: string;
  precautions: string;
  sources: { title: string; url: string }[];
} | null {
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    const sources = Array.isArray(p.sources)
      ? (p.sources as { title?: string; url?: string }[])
          .filter((s) => typeof s?.url === "string")
          .map((s) => ({
            title: typeof s.title === "string" ? s.title : s.url!,
            url: s.url!,
          }))
      : [];
    return {
      name: typeof p.name === "string" ? p.name : "",
      genericNames: Array.isArray(p.genericNames)
        ? (p.genericNames as unknown[]).filter((x) => typeof x === "string") as string[]
        : [],
      uses: typeof p.uses === "string" ? p.uses : "",
      dosage: typeof p.dosage === "string" ? p.dosage : "",
      sideEffects: typeof p.sideEffects === "string" ? p.sideEffects : "",
      precautions: typeof p.precautions === "string" ? p.precautions : "",
      sources,
    };
  } catch {
    return null;
  }
}

export const explain = action({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    const query = q.trim();
    if (!query) {
      return {
        fromCache: true as const,
        results: [] as const,
      };
    }

    const hits: Doc<"medicines">[] = await ctx.runQuery(
      api.medicinesDb.searchMedicinesPublic,
      { q: query }
    );

    if (hits.length > 0) {
      return {
        fromCache: true as const,
        results: hits.map((h: Doc<"medicines">) => ({
          _id: h._id,
          name: h.name,
          genericNames: h.genericNames,
          uses: h.uses,
          dosage: h.dosage,
          sideEffects: h.sideEffects,
          precautions: h.precautions,
        })),
      };
    }

    const snippets = await exaSearchMedicine(query);
    if (snippets.length === 0) {
      return {
        fromCache: false as const,
        results: [] as const,
        message:
          "No matching medicine in our database and no live sources retrieved. Check EXA_API_KEY.",
      };
    }

    const context = snippets
      .map((s) => `[${s.title}](${s.url})\n${s.text.slice(0, 2500)}`)
      .join("\n\n---\n\n");

    const system = `You are a pharmacy information assistant. Use ONLY the CONTEXT below. Return valid JSON with keys:
name (string, medicine name queried),
genericNames (string array, may be empty if not in context),
uses, dosage, sideEffects, precautions (strings, educational summaries),
sources (array of {title, url} — ONLY urls present in CONTEXT).

If context is thin, say so in precautions. Never invent URLs.`;

    const raw = await chat(
      system,
      [
        {
          role: "user",
          content: `Medicine search: ${query}\n\nCONTEXT:\n${context}`,
        },
      ],
      { responseFormat: "json", temperature: 0.2 }
    );

    const parsed = parseExplainJson(raw);
    if (!parsed || !parsed.name) {
      return {
        fromCache: false as const,
        results: [] as const,
        message: "Could not synthesize medicine information from sources.",
      };
    }

    return {
      fromCache: false as const,
      synthesized: parsed,
    };
  },
});
