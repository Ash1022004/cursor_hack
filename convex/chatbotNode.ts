"use node";

import { internalAction } from "./_generated/server";

/** LLM availability for health checks (no FastAPI). */
export const chatbotHealth = internalAction({
  args: {},
  handler: async () => {
    const gemini = Boolean(process.env.GEMINI_API_KEY);
    const openai = Boolean(process.env.OPENAI_API_KEY);
    return { ok: gemini || openai, gemini, openai };
  },
});
