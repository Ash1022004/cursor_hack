"use node";

import { z } from "zod";
import { chat } from "../lib/llm";
import type { AgentType, PatientProfile, SupervisorResult } from "./types";
import { crisisAgent } from "./crisisAgent";
import { empathyAgent } from "./empathyAgent";
import { moodAgent } from "./moodAgent";
import { resourceAgent } from "./resourceAgent";
import { screeningAgent } from "./screeningAgent";

const routingSchema = z.object({
  agentType: z.enum([
    "empathy",
    "screening",
    "mood",
    "crisis",
    "resource",
  ]),
  reasoning: z.string().optional(),
});

const supervisorPrompt = (profile: PatientProfile) => `
You are the supervisor of Sehat Saathi, a mental health support platform.

PATIENT CONTEXT:
- Sessions completed: ${profile.totalSessions}
- Known conditions: ${profile.conditions.join(", ") || "none yet"}
- Known triggers: ${profile.triggers.join(", ") || "none yet"}
- PHQ-9 score: ${profile.phqScore ?? "not assessed"}
- Crisis history: ${profile.crisisFlag ? "YES — handle with extreme care" : "none"}
- Preferred language: ${profile.language}
- Coping patterns that helped: ${profile.copingPatterns.join(", ") || "none yet"}

ROUTING:
- crisis → suicidal ideation, self-harm, hopelessness, no point living
- screening → first sessions OR asks about mental health status / assessment
- mood → daily check-in, how they feel today, rate mood
- resource → exercises, helplines, techniques, articles
- empathy → default venting and support

Respond ONLY with JSON: { "agentType": "empathy"|"screening"|"mood"|"crisis"|"resource", "reasoning": "..." }
`;

const crisisKeywords = [
  "kill myself",
  "end my life",
  "don't want to live",
  "do not want to live",
  "want to die",
  "no point",
  "hurt myself",
  "self harm",
  "suicide",
  "end it all",
  "better off dead",
];

export async function supervisor(
  profile: PatientProfile,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<SupervisorResult> {
  const lowerMsg = userMessage.toLowerCase();
  if (crisisKeywords.some((k) => lowerMsg.includes(k))) {
    const response = await crisisAgent(profile, history, userMessage);
    return { agentType: "crisis", response };
  }

  const routingResponse = await chat(
    supervisorPrompt(profile),
    [{ role: "user", content: userMessage }],
    { temperature: 0, responseFormat: "json" }
  );

  let agentType: AgentType = "empathy";
  try {
    const parsed = JSON.parse(routingResponse);
    const r = routingSchema.safeParse(parsed);
    if (r.success) agentType = r.data.agentType;
  } catch {
    agentType = "empathy";
  }

  let response: string;
  switch (agentType) {
    case "screening":
      response = await screeningAgent(profile, history, userMessage);
      break;
    case "mood":
      response = await moodAgent(profile, history, userMessage);
      break;
    case "crisis":
      response = await crisisAgent(profile, history, userMessage);
      break;
    case "resource":
      response = await resourceAgent(profile, history, userMessage);
      break;
    default:
      response = await empathyAgent(profile, history, userMessage);
      agentType = "empathy";
  }

  return { agentType, response };
}
