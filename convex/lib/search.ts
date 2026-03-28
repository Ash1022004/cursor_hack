"use node";

import Exa from "exa-js";
import { ApifyClient } from "apify-client";

export type SearchSnippet = {
  source: "exa" | "apify";
  title: string;
  url: string;
  text: string;
};

function dedupeByUrl(items: SearchSnippet[]): SearchSnippet[] {
  const seen = new Set<string>();
  const out: SearchSnippet[] = [];
  for (const item of items) {
    const key = item.url.split("#")[0].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export async function exaSearch(
  query: string,
  conditions: string[]
): Promise<SearchSnippet[]> {
  const key = process.env.EXA_API_KEY;
  if (!key) return [];
  const enriched = `mental health ${conditions.join(" ")} ${query} India resources helpline`;
  const exa = new Exa(key);
  try {
    const results = await exa.searchAndContents(enriched, {
      numResults: 4,
      highlights: true,
      includeDomains: [
        "nimhans.ac.in",
        "icallhelpline.org",
        "vandrevalafoundation.com",
        "healthline.com",
        "who.int",
      ],
    });
    type ExaRow = {
      title?: string | null;
      url?: string;
      highlights?: string[];
      text?: string;
    };
    return (results.results ?? []).map((r): SearchSnippet => {
      const row = r as unknown as ExaRow;
      const highlight =
        row.highlights && typeof row.highlights[0] === "string"
          ? row.highlights[0]
          : "";
      return {
        source: "exa",
        title: row.title ?? row.url ?? "link",
        url: row.url ?? "",
        text:
          highlight ||
          (typeof row.text === "string" ? row.text.slice(0, 400) : "") ||
          "",
      };
    });
  } catch {
    return [];
  }
}

/**
 * Apify Google Search Scraper (or override via APIFY_GOOGLE_SEARCH_ACTOR_ID).
 */
export async function apifyWebSearch(query: string): Promise<SearchSnippet[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return [];
  const actorId =
    process.env.APIFY_GOOGLE_SEARCH_ACTOR_ID?.trim() ||
    "apify/google-search-scraper";
  const client = new ApifyClient({ token });
  try {
    const run = await client.actor(actorId).call({
      queries: `${query} mental health India Kashmir helpline`,
      maxPagesPerQuery: 1,
      resultsPerPage: 4,
    });
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    type ApifyItem = {
      title?: string;
      url?: string;
      description?: string;
      snippet?: string;
      searchResult?: { title?: string; url?: string };
    };
    const out: SearchSnippet[] = [];
    for (const raw of items ?? []) {
      const item = raw as ApifyItem;
      const sr = item.searchResult;
      const title =
        (typeof item.title === "string" && item.title) ||
        (typeof sr?.title === "string" && sr.title) ||
        "result";
      const url =
        (typeof item.url === "string" && item.url) ||
        (typeof sr?.url === "string" && sr.url) ||
        "";
      const text =
        (typeof item.description === "string" && item.description) ||
        (typeof item.snippet === "string" && item.snippet) ||
        "";
      if (url) out.push({ source: "apify", title, url, text });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Parallel Exa + Apify, merged and deduped for agent RAG context.
 */
export async function searchResources(
  query: string,
  conditions: string[]
): Promise<string> {
  const [exa, apify] = await Promise.all([
    exaSearch(query, conditions),
    apifyWebSearch(query),
  ]);
  const merged = dedupeByUrl([...exa, ...apify]).slice(0, 8);
  if (merged.length === 0) {
    return "No live web results retrieved (check EXA_API_KEY / APIFY_TOKEN). Use general mental-health guidance and helplines from your training.";
  }
  return merged
    .map(
      (r) =>
        `[${r.source.toUpperCase()}] ${r.title}\nURL: ${r.url}\n${r.text.slice(0, 500)}`
    )
    .join("\n\n---\n\n");
}
