"use node";

import { chat } from "../lib/llm";
import type { PatientProfile } from "./types";

const systemPrompt = (profile: PatientProfile) => `
You are Saathi doing a daily mood check-in.

PATIENT HISTORY:
- Previous triggers: ${profile.triggers.join(", ") || "none known"}
- Coping patterns: ${profile.copingPatterns.join(", ") || "none identified"}

FLOW:
1. If they have not rated mood, ask for 1-10
2. Ask what shaped today's mood
3. If score low: one coping technique
4. If score high: brief celebration
5. End noting you are logging the day

Keep under 150 words. Warm tone.
`;

export async function moodAgent(
  profile: PatientProfile,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<string> {
  return chat(systemPrompt(profile), [
    ...history.slice(-4),
    { role: "user", content: userMessage },
  ]);
}
