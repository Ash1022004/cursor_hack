"use node";

import { z } from "zod";
import { chat } from "../lib/llm";
import {
  chatTrace,
  isChatTraceEnabled,
  isChatTraceVerbose,
  type ChatTurnTrace,
} from "../lib/chatTrace";
import type { ExtractedData } from "./types";

const extractionSchema = z.object({
  conditions: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  triggers: z.array(z.string()).default([]),
  copingPatterns: z.array(z.string()).default([]),
  commitments: z.array(z.string()).default([]),
  phqHint: z.number().min(0).max(3).optional().nullable(),
  crisisSignal: z.boolean().default(false),
  dominantEmotion: z.string().default("neutral"),
  moodScore: z.number().min(1).max(10).default(5),
});

const EXTRACTION_PROMPT = `
You are a silent clinical data extractor.
Given a patient message, extract structured mental health data.
Return ONLY valid JSON matching this schema exactly:
{
  "conditions": [],
  "medications": [],
  "triggers": [],
  "copingPatterns": [],
  "commitments": [],
  "phqHint": null,
  "crisisSignal": false,
  "dominantEmotion": "",
  "moodScore": 5
}
Rules:
- crisisSignal = true for ANY phrase like suicidal ideation, self-harm, hopelessness, wanting to die
- Be conservative — only extract what is actually present
- Empty arrays if nothing detected
- moodScore 1-10 from tone
- commitments: extract self-improvement promises/intentions (e.g. "I'll try to meditate", "I want to sleep earlier", "I'm going to exercise more"). Only clear personal commitments, not vague statements.
`;

function logExtraction(
  trace: ChatTurnTrace | undefined,
  payload: Record<string, unknown>
): void {
  if (!trace || !isChatTraceEnabled()) return;
  chatTrace("extraction_done", { turnId: trace.turnId, ...payload });
}

export async function extractFromMessage(
  userMessage: string,
  trace?: ChatTurnTrace
): Promise<ExtractedData> {
  const raw = await chat(
    EXTRACTION_PROMPT,
    [{ role: "user", content: userMessage }],
    {
      temperature: 0,
      responseFormat: "json",
      trace: trace
        ? { turnId: trace.turnId, call: "extraction" }
        : undefined,
    }
  );
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    logExtraction(trace, { parseOk: false, reason: "json_parse" });
    return {
      conditions: [],
      medications: [],
      triggers: [],
      copingPatterns: [],
      commitments: [],
      crisisSignal: false,
      dominantEmotion: "neutral",
      moodScore: 5,
    };
  }
  const result = extractionSchema.safeParse(parsed);
  if (!result.success) {
    logExtraction(trace, { parseOk: false, reason: "schema" });
    return {
      conditions: [],
      medications: [],
      triggers: [],
      copingPatterns: [],
      commitments: [],
      crisisSignal: false,
      dominantEmotion: "neutral",
      moodScore: 5,
    };
  }
  const d = result.data;
  const basePayload: Record<string, unknown> = {
    parseOk: true,
    crisisSignal: d.crisisSignal,
    moodScore: d.moodScore,
    dominantEmotion: d.dominantEmotion,
    conditionsCount: d.conditions.length,
    medicationsCount: d.medications.length,
    triggersCount: d.triggers.length,
    copingPatternsCount: d.copingPatterns.length,
  };
  if (isChatTraceVerbose()) {
    basePayload.conditions = d.conditions;
    basePayload.medications = d.medications;
    basePayload.triggers = d.triggers;
    basePayload.copingPatterns = d.copingPatterns;
  }
  logExtraction(trace, basePayload);

  return {
    conditions: d.conditions,
    medications: d.medications,
    triggers: d.triggers,
    copingPatterns: d.copingPatterns,
    commitments: d.commitments,
    phqHint: d.phqHint ?? undefined,
    crisisSignal: d.crisisSignal,
    dominantEmotion: d.dominantEmotion,
    moodScore: d.moodScore,
  };
}
