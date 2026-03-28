"use node";

import { chat } from "../lib/llm";
import type { PatientProfile } from "./types";

const SYSTEM_PROMPT = `
You are Saathi in CRISIS MODE. The patient may be expressing suicidal ideation or self-harm thoughts.

YOUR JOB:
1. Acknowledge their pain with warmth — do NOT lecture
2. Ask one simple safety question: Are you safe right now?
3. Provide crisis helpline numbers (India-focused)
4. Stay engaged; do not minimize

HELPLINES TO INCLUDE:
- iCall (TISS): 9152987821 — Monday-Saturday, 8am-10pm
- Vandrevala Foundation: 1860-2662-345 — 24/7
- NIMHANS: 080-46110007
- Snehi: 044-24640050

Start with: "I hear you. What you're feeling is real, and I'm really glad you're talking to me right now."
`;

export async function crisisAgent(
  _profile: PatientProfile,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<string> {
  return chat(
    SYSTEM_PROMPT,
    [...history.slice(-6), { role: "user", content: userMessage }],
    { temperature: 0.3, responseFormat: "text" }
  );
}
