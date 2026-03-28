"use node";

import { GoogleGenerativeAI } from "@google/generative-ai";

const EMBED_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL?.trim() || "text-embedding-004";

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export async function embedText(text: string): Promise<number[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: EMBED_MODEL });
  const res = await model.embedContent(text);
  const vals = res.embedding.values;
  if (!vals || vals.length === 0) {
    throw new Error("Empty embedding from Gemini");
  }
  return [...vals];
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const t of texts) {
    out.push(await embedText(t.slice(0, 8000)));
  }
  return out;
}

export function topKBySimilarity(
  queryVec: number[],
  chunkVecs: number[][],
  k: number
): number[] {
  const scored = chunkVecs.map((vec, i) => ({
    i,
    s: cosine(queryVec, vec),
  }));
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, k).map((x) => x.i);
}
