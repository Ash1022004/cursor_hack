"use node";

import { chat } from "../lib/llm";
import type { PatientProfile } from "./types";

const PHQ9_QUESTIONS = [
  "Over the last 2 weeks, how often have you had little interest or pleasure in doing things?",
  "How often have you been feeling down, depressed, or hopeless?",
  "How often have you had trouble falling or staying asleep, or sleeping too much?",
  "How often have you been feeling tired or having little energy?",
  "How often have you had poor appetite or been overeating?",
  "How often have you felt bad about yourself — or that you are a failure?",
  "How often have you had trouble concentrating on things?",
  "How often have you been moving or speaking slowly, or been fidgety or restless?",
  "How often have you had thoughts that you would be better off dead or of hurting yourself?",
];

const systemPrompt = (profile: PatientProfile) => `
You are Saathi conducting a gentle PHQ-9 mental health screening.

CONTEXT:
- Sessions so far: ${profile.totalSessions}
- Current PHQ score: ${profile.phqScore ?? "not yet assessed"}
- Language code: ${profile.language}

PHQ-9 QUESTIONS (conversational, not a form):
${PHQ9_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n")}

INSTRUCTIONS:
- Ask ONE question at a time, conversationally
- Scale: Not at all (0) / Several days (1) / More than half the days (2) / Nearly every day (3)
- After all 9, summarize score bands: 0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe
- If Q9 suggests any risk, urge crisis lines gently
- Prefer English unless language is hi, ur, or ks — then use that language briefly if you can
`;

export async function screeningAgent(
  profile: PatientProfile,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<string> {
  return chat(systemPrompt(profile), [
    ...history.slice(-20),
    { role: "user", content: userMessage },
  ]);
}
