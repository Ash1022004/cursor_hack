"use node";

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type ChatOptions = {
  temperature?: number;
  responseFormat?: "json" | "text";
};

function llmProvider(): "gemini" | "openai" {
  const p = process.env.LLM_PROVIDER?.toLowerCase().trim();
  if (p === "openai") return "openai";
  return "gemini";
}

function geminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

function openaiModelName(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o";
}

/**
 * Unified chat completion: Gemini by default, OpenAI when LLM_PROVIDER=openai.
 */
export async function chat(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  options?: ChatOptions
): Promise<string> {
  const temperature = options?.temperature ?? 0.7;
  const wantJson = options?.responseFormat === "json";
  const provider = llmProvider();

  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("OPENAI_API_KEY is not set (LLM_PROVIDER=openai)");
    }
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: openaiModelName(),
      temperature,
      response_format: wantJson
        ? { type: "json_object" }
        : { type: "text" },
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });
    const text = completion.choices[0]?.message?.content ?? "";
    return text;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({
    model: geminiModelName(),
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature,
      ...(wantJson ? { responseMimeType: "application/json" } : {}),
    },
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") {
    const result = await model.generateContent({
      contents: [
        ...history,
        {
          role: "user",
          parts: [{ text: messages.map((m) => `${m.role}: ${m.content}`).join("\n\n") }],
        },
      ],
    });
    return result.response.text();
  }

  const chatSession = model.startChat({ history });
  const result = await chatSession.sendMessage(last.content);
  return result.response.text();
}
