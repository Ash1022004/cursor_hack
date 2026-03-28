"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { chat } from "./lib/llm";
import { extractFromMessage } from "./agents/extraction";

const SUMMARY_PROMPT = `You are a compassionate mental health journaling assistant.
Given a voice journal transcription, provide a brief emotional summary (2-3 sentences).
Identify the dominant emotion and overall tone. Be warm and validating.
Do not give advice — just reflect what you hear.`;

export const processVoiceJournal = action({
  args: {
    storageId: v.id("_storage"),
    anonymousId: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, { storageId, anonymousId, duration }) => {
    // 1. Get patient
    const patient = await ctx.runQuery(
      internal.patients.getByAnonymousId,
      { anonymousId }
    );
    if (!patient) throw new Error("Patient not found");

    // 2. Get file URL from Convex storage
    const fileUrl = await ctx.storage.getUrl(storageId);
    if (!fileUrl) throw new Error("File not found in storage");

    // 3. Download the audio file
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) throw new Error("Failed to fetch audio file");
    const audioBuffer = await audioResponse.arrayBuffer();

    // 4. Transcribe via Groq Whisper
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error("GROQ_API_KEY is not set");

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([audioBuffer], { type: "audio/webm" }),
      "journal.webm"
    );
    formData.append("model", "whisper-large-v3");
    formData.append("language", "en");

    const whisperResponse = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}` },
        body: formData,
      }
    );
    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      throw new Error(`Groq Whisper error: ${errText}`);
    }
    const whisperData = (await whisperResponse.json()) as { text: string };
    const transcription = whisperData.text;

    // 5. Generate emotional summary
    const summary = await chat(
      SUMMARY_PROMPT,
      [{ role: "user", content: transcription }],
      { temperature: 0.5 }
    );

    // 6. Extract mood/emotion data
    const extracted = await extractFromMessage(transcription);

    // 7. Save to voiceJournals
    await ctx.runMutation(internal.voiceJournalsDb.saveJournal, {
      patientId: patient._id,
      storageId,
      duration,
      transcription,
      summary,
      moodScore: extracted.moodScore,
      emotion: extracted.dominantEmotion,
    });

    // 8. Update patient profile from extraction
    await ctx.runMutation(internal.patients.updateFromExtraction, {
      patientId: patient._id,
      conditions: extracted.conditions,
      medications: extracted.medications,
      triggers: extracted.triggers,
      copingPatterns: extracted.copingPatterns,
      commitments: extracted.commitments,
      crisisSignal: extracted.crisisSignal,
      moodScore: extracted.moodScore,
      dominantEmotion: extracted.dominantEmotion,
    });

    return {
      transcription,
      summary,
      moodScore: extracted.moodScore,
      emotion: extracted.dominantEmotion,
      crisisDetected: extracted.crisisSignal,
    };
  },
});
