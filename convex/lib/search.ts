"use node";

import Exa from "exa-js";
import { apifyListDatasetItems, apifyRunActorSync } from "./apifyRest";
import {
  chatTrace,
  isChatTraceEnabled,
  isChatTraceVerbose,
  type ChatTurnTrace,
} from "./chatTrace";

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
  const apiKey = process.env.APIFY_API_KEY?.trim();
  if (!apiKey) return [];
  const actorId =
    process.env.APIFY_GOOGLE_SEARCH_ACTOR_ID?.trim() ||
    "apify/google-search-scraper";
  try {
    const { datasetId: outDatasetId } = await apifyRunActorSync(
      apiKey,
      actorId,
      {
        queries: `${query} mental health India Kashmir helpline`,
        maxPagesPerQuery: 1,
        resultsPerPage: 4,
      },
      120
    );
    const items = await apifyListDatasetItems(apiKey, outDatasetId, {
      clean: false,
      limit: 100,
    });
    type ApifyItem = {
      title?: string;
      url?: string;
      description?: string;
      snippet?: string;
      searchResult?: { title?: string; url?: string };
    };
    const out: SearchSnippet[] = [];
    for (const raw of items) {
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
 * Search for local events, meetups, and support groups near a location.
 */
export async function searchLocalEvents(
  query: string,
  location: string
): Promise<SearchSnippet[]> {
  const exaKey = process.env.EXA_API_KEY;
  const apifyKey = process.env.APIFY_API_KEY?.trim();

  const exaPromise = (async (): Promise<SearchSnippet[]> => {
    if (!exaKey) return [];
    const exa = new Exa(exaKey);
    try {
      const results = await exa.searchAndContents(
        `${query} events meetups community near ${location}`,
        {
          numResults: 4,
          highlights: true,
          includeDomains: [
            "meetup.com",
            "eventbrite.com",
            "facebook.com",
            "allevents.in",
            "insider.in",
          ],
        }
      );
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
          title: row.title ?? row.url ?? "event",
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
  })();

  const apifyPromise = (async (): Promise<SearchSnippet[]> => {
    if (!apifyKey) return [];
    try {
      return await apifyWebSearch(
        `community events ${location} mental health support groups meetups`
      );
    } catch {
      return [];
    }
  })();

  const [exaResults, apifyResults] = await Promise.all([
    exaPromise,
    apifyPromise,
  ]);
  return dedupeByUrl([...exaResults, ...apifyResults]).slice(0, 6);
}

/**
 * Parallel Exa + Apify, merged and deduped for agent RAG context.
 */
export async function searchResources(
  query: string,
  conditions: string[],
  trace?: ChatTurnTrace
): Promise<string> {
  const exaSkippedNoKey = !process.env.EXA_API_KEY?.trim();
  const apifySkippedNoKey = !process.env.APIFY_API_KEY?.trim();
  const enriched = `mental health ${conditions.join(" ")} ${query} India resources helpline`;

  const [exa, apify] = await Promise.all([
    exaSearch(query, conditions),
    apifyWebSearch(query),
  ]);
  const merged = dedupeByUrl([...exa, ...apify]).slice(0, 8);

  if (trace && isChatTraceEnabled()) {
    const payload: Record<string, unknown> = {
      turnId: trace.turnId,
      exaCount: exa.length,
      apifyCount: apify.length,
      mergedCount: merged.length,
      exaSkippedNoKey,
      apifySkippedNoKey,
      enrichedQueryLength: enriched.length,
    };
    if (isChatTraceVerbose()) {
      payload.enrichedQuery = enriched;
    }
    chatTrace("search_resources", payload);
  }

  if (merged.length === 0) {
    return "No live web results retrieved (check EXA_API_KEY / APIFY_API_KEY). Use general mental-health guidance and helplines from your training.";
  }
  return merged
    .map(
      (r) =>
        `[${r.source.toUpperCase()}] ${r.title}\nURL: ${r.url}\n${r.text.slice(0, 500)}`
    )
    .join("\n\n---\n\n");
}
