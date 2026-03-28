"use node";

import { chat } from "../lib/llm";
import { searchResources } from "../lib/search";
import type { PatientProfile } from "./types";

export async function resourceAgent(
  profile: PatientProfile,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<string> {
  const exaResults = await searchResources(userMessage, profile.conditions);

  const systemPrompt = `
You are Saathi's resource specialist.

PATIENT CONTEXT:
- Conditions: ${profile.conditions.join(", ") || "general mental health"}
- Language: ${profile.language}
- PHQ-9 (if any): ${profile.phqScore ?? "unknown"}

RELEVANT WEB RESULTS (Exa + Apify):
${exaResults}

YOUR JOB:
- Recommend 2-3 specific, actionable resources using the URLs above when relevant
- Explain WHY each helps
- Include at least one India-relevant option when possible
- Weave into a caring response, not a bullet dump
`;

  return chat(systemPrompt, [
    ...history.slice(-4),
    { role: "user", content: userMessage },
  ]);
}
