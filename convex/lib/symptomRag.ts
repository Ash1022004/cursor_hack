"use node";

import Exa from "exa-js";

export type SymptomSourceDoc = {
  title: string;
  url: string;
  text: string;
};

const SYMPTOM_DOMAINS = [
  "who.int",
  "mayoclinic.org",
  "medlineplus.gov",
  "nih.gov",
  "cdsco.gov.in",
  "my.clevelandclinic.org",
];

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 120;

export type TextChunk = {
  text: string;
  title: string;
  url: string;
};

export async function exaSearchSymptoms(
  userQuery: string
): Promise<SymptomSourceDoc[]> {
  const key = process.env.EXA_API_KEY;
  if (!key) return [];

  const exa = new Exa(key);
  const enriched = `${userQuery} symptoms health information patient education`;

  try {
    const results = await exa.searchAndContents(enriched, {
      numResults: 5,
      highlights: true,
      text: { maxCharacters: 12000 },
      includeDomains: SYMPTOM_DOMAINS,
    });

    type ExaRow = {
      title?: string | null;
      url?: string;
      highlights?: string[];
      text?: string;
    };

    return (results.results ?? [])
      .map((r): SymptomSourceDoc | null => {
        const row = r as unknown as ExaRow;
        const highlight =
          row.highlights && typeof row.highlights[0] === "string"
            ? row.highlights[0]
            : "";
        const body =
          typeof row.text === "string" && row.text.length > 0
            ? row.text
            : highlight;
        const url = row.url ?? "";
        if (!url || !body.trim()) return null;
        return {
          title: row.title ?? url,
          url,
          text: body,
        };
      })
      .filter((x): x is SymptomSourceDoc => x !== null);
  } catch {
    return [];
  }
}

export function chunkDocuments(docs: SymptomSourceDoc[]): TextChunk[] {
  const chunks: TextChunk[] = [];
  for (const doc of docs) {
    const t = doc.text.replace(/\s+/g, " ").trim();
    if (!t) continue;
    let start = 0;
    while (start < t.length) {
      const end = Math.min(start + CHUNK_SIZE, t.length);
      const slice = t.slice(start, end);
      if (slice.length > 80) {
        chunks.push({ text: slice, title: doc.title, url: doc.url });
      }
      if (end >= t.length) break;
      start = end - CHUNK_OVERLAP;
      if (start < 0) start = 0;
    }
  }
  return chunks;
}
