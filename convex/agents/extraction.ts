"use node";

import { z } from "zod";
import { chat } from "../lib/llm";
import type { ExtractedData } from "./types";

const extractionSchema = z.object({
  conditions: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  triggers: z.array(z.string()).default([]),
  copingPatterns: z.array(z.string()).default([]),
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
`;

export async function extractFromMessage(
  userMessage: string
): Promise<ExtractedData> {
  const raw = await chat(
    EXTRACTION_PROMPT,
    [{ role: "user", content: userMessage }],
    { temperature: 0, responseFormat: "json" }
  );
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      conditions: [],
      medications: [],
      triggers: [],
      copingPatterns: [],
      crisisSignal: false,
      dominantEmotion: "neutral",
      moodScore: 5,
    };
  }
  const result = extractionSchema.safeParse(parsed);
  if (!result.success) {
    return {
      conditions: [],
      medications: [],
      triggers: [],
      copingPatterns: [],
      crisisSignal: false,
      dominantEmotion: "neutral",
      moodScore: 5,
    };
  }
  const d = result.data;
  return {
    conditions: d.conditions,
    medications: d.medications,
    triggers: d.triggers,
    copingPatterns: d.copingPatterns,
    phqHint: d.phqHint ?? undefined,
    crisisSignal: d.crisisSignal,
    dominantEmotion: d.dominantEmotion,
    moodScore: d.moodScore,
  };
}
