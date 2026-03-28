"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { chat } from "./lib/llm";
import { chunkDocuments, exaSearchSymptoms } from "./lib/symptomRag";
import { embedMany, topKBySimilarity } from "./lib/embeddings";
import { ruleBasedSymptomCheck } from "./lib/symptomRules";

const MEDICAL_DISCLAIMER =
  "This platform provides general medical information and is not a substitute for professional medical advice.";

function parseSymptomJson(raw: string): {
  possible_conditions: string[];
  suggested_medicines: { generic: string; note: string }[];
  advice: string;
  sources: { title: string; url: string }[];
} | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const possible_conditions = Array.isArray(parsed.possible_conditions)
      ? (parsed.possible_conditions as string[]).filter(
          (x) => typeof x === "string"
        )
      : [];
    const suggested_medicines = Array.isArray(parsed.suggested_medicines)
      ? (parsed.suggested_medicines as { generic?: string; note?: string }[])
          .filter((m) => typeof m?.generic === "string")
          .map((m) => ({
            generic: String(m.generic),
            note: typeof m.note === "string" ? m.note : "",
          }))
      : [];
    const advice =
      typeof parsed.advice === "string" ? parsed.advice : "";
    const sources = Array.isArray(parsed.sources)
      ? (parsed.sources as { title?: string; url?: string }[])
          .filter((s) => typeof s?.url === "string" && s.url.length > 0)
          .map((s) => ({
            title: typeof s.title === "string" ? s.title : s.url!,
            url: s.url!,
          }))
      : [];
    return {
      possible_conditions,
      suggested_medicines,
      advice,
      sources,
    };
  } catch {
    return null;
  }
}

export const runRag = action({
  args: {
    symptoms: v.union(v.string(), v.array(v.string())),
    age: v.number(),
    gender: v.string(),
    duration: v.string(),
  },
  handler: async (_ctx, args) => {
    const symptomsText = Array.isArray(args.symptoms)
      ? args.symptoms.join(", ")
      : args.symptoms;

    const docs = await exaSearchSymptoms(symptomsText);
    const chunks = chunkDocuments(docs);

    if (docs.length === 0 || chunks.length === 0) {
      const r = ruleBasedSymptomCheck({
        symptoms: args.symptoms,
        age: args.age,
        gender: args.gender,
        duration: args.duration,
      });
      return {
        ...r,
        disclaimer: MEDICAL_DISCLAIMER,
      };
    }

    const queryForEmbed = `Symptoms: ${symptomsText}. Age ${args.age}, gender ${args.gender}, duration: ${args.duration}.`;
    const chunkTexts = chunks.map((c) => c.text);

    let context: string;
    try {
      const allVecs = await embedMany([queryForEmbed, ...chunkTexts]);
      const qVec = allVecs[0]!;
      const chunkVecs = allVecs.slice(1);
      const k = Math.min(10, chunkVecs.length);
      const idxs = topKBySimilarity(qVec, chunkVecs, k);
      const selected = idxs.map((i) => chunks[i]!);
      context = selected
        .map(
          (c) =>
            `Source title: ${c.title}\nSource URL: ${c.url}\nExcerpt:\n${c.text}`
        )
        .join("\n\n---\n\n");
    } catch {
      context = chunks
        .slice(0, 8)
        .map(
          (c) =>
            `Source title: ${c.title}\nSource URL: ${c.url}\nExcerpt:\n${c.text}`
        )
        .join("\n\n---\n\n");
    }

    const system = `You are a clinical information assistant. Use ONLY the CONTEXT excerpts below (from trusted health sources). Do not invent studies or URLs.
Return valid JSON only with keys:
- possible_conditions: string[] (tentative, educational phrasing; never definitive diagnosis)
- suggested_medicines: array of { "generic": string, "note": string } — only common OTC/supportive examples where appropriate; note prescription-only drugs must follow a clinician
- advice: string (when to seek care, red flags)
- sources: array of { "title": string, "url": string } — MUST only list URLs that appear in CONTEXT

If CONTEXT is insufficient, say so in advice and keep sources empty or only from CONTEXT. Never claim certainty.`;

    const userMsg = `CONTEXT:\n${context}\n\n---\nPatient report:\nSymptoms: ${symptomsText}\nAge: ${args.age}\nGender: ${args.gender}\nDuration: ${args.duration}`;

    const raw = await chat(
      system,
      [{ role: "user", content: userMsg }],
      { responseFormat: "json", temperature: 0.2 }
    );

    const parsed = parseSymptomJson(raw);
    if (!parsed) {
      const r = ruleBasedSymptomCheck({
        symptoms: args.symptoms,
        age: args.age,
        gender: args.gender,
        duration: args.duration,
      });
      return {
        ...r,
        disclaimer: MEDICAL_DISCLAIMER,
      };
    }

    return {
      possible_conditions: parsed.possible_conditions,
      suggested_medicines: parsed.suggested_medicines,
      advice: parsed.advice,
      sources: parsed.sources,
      source: "rag" as const,
      disclaimer: MEDICAL_DISCLAIMER,
    };
  },
});
