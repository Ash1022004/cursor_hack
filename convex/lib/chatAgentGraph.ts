"use node";

import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { PatientProfile } from "../agents/types";
import {
  apifyWebSearch,
  exaSearch,
  searchLocalEvents,
  type SearchSnippet,
} from "./search";
import {
  chatTrace,
  isChatTraceEnabled,
  type ChatTurnTrace,
} from "./chatTrace";
import type { ActionCtx } from "../_generated/server";
import { api } from "../_generated/api";

const HISTORY_PAIR_LIMIT = 10;
const FALLBACK_REPLY =
  "I'm having trouble responding right now. Please try again in a moment, or reach out to a trusted person or helpline if you need immediate support.";

function maxIterationsFromEnv(): number {
  const raw = process.env.CHAT_AGENT_MAX_ITERATIONS?.trim();
  const n = raw ? parseInt(raw, 10) : 5;
  if (!Number.isFinite(n)) return 5;
  return Math.min(15, Math.max(1, n));
}

/** LangGraph step budget: each tool round uses multiple internal steps. */
function recursionLimitForMaxIterations(maxIter: number): number {
  return Math.max(4, 2 * maxIter + 4);
}

function formatSnippets(
  sourceLabel: string,
  items: SearchSnippet[]
): string {
  if (items.length === 0) {
    return `No ${sourceLabel} results (check API key or try a different query).`;
  }
  return items
    .map(
      (r) =>
        `[${sourceLabel}] ${r.title}\nURL: ${r.url}\n${r.text.slice(0, 500)}`
    )
    .join("\n\n---\n\n");
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

function buildSystemPrompt(
  profile: PatientProfile,
  pendingCommitments?: { text: string; detectedAt: number }[]
): string {
  const commitmentsSection =
    pendingCommitments && pendingCommitments.length > 0
      ? `\n\nPREVIOUS COMMITMENTS (gently check in on these when appropriate — don't force it):\n${pendingCommitments.map((c) => `- "${c.text}" (${formatTimeAgo(c.detectedAt)})`).join("\n")}`
      : "";

  return `You are Saathi, a warm mental health companion on Sehat Saathi for Indian and Kashmiri students.

PATIENT CONTEXT (use for tone and personalization; do not repeat verbatim as a list):
- Sessions completed: ${profile.totalSessions}
- Known conditions: ${profile.conditions.join(", ") || "none yet"}
- Medications mentioned: ${profile.medications.join(", ") || "none yet"}
- Triggers: ${profile.triggers.join(", ") || "none yet"}
- Coping patterns that helped: ${profile.copingPatterns.join(", ") || "none yet"}
- PHQ-9: ${profile.phqScore ?? "not assessed"} | GAD: ${profile.gadScore ?? "not assessed"}
- Prior crisis flag in record: ${profile.crisisFlag ? "yes — be extra careful" : "no"}
- Preferred language code: ${profile.language}

LANGUAGE:
- The user's preferred language is "${profile.language}". Respond in this language.
- "en" = English, "hi" = Hindi (Devanagari script), "ur" = Urdu (Nastaliq script), "ks" = Kashmiri (Nastaliq script).
- If the user writes in a different language than their preference, match the language they are currently using.
- Keep helpline numbers and URLs in English regardless of language.

TOOLS:
- exa_search: curated web search (trusted domains). Use for mental health resources, helplines, articles, techniques.
- apify_search: broader web search. Use when you need additional angles or Exa returned little.
- resource_library: search Sehat Saathi's curated resource library (cached articles, guides, self-help material). Use this FIRST before exa_search when the user asks for resources, articles, or self-help guides.
- local_events: search for local events, meetups, and support groups near a city. Use when the user seems lonely, isolated, or wants to connect with people. Default to India/Kashmir context if location is unclear.

Call tools only when the user needs current or specific external information. For pure venting or reflection, respond directly without tools.

SAFETY:
- If the user expresses suicidal ideation, self-harm, or wanting to die: acknowledge with care, ask if they are safe right now, and include India helplines: iCall 9152987821, Vandrevala 1860-2662-345, NIMHANS 080-46110007, Snehi 044-24640050.
- Never dismiss feelings. Keep responses concise (roughly 2–4 short paragraphs unless the user asks for detail).${commitmentsSection}`;
}

function historyToMessages(
  history: { role: "user" | "assistant"; content: string }[]
): (HumanMessage | AIMessage)[] {
  const slice = history.slice(-HISTORY_PAIR_LIMIT * 2);
  const out: (HumanMessage | AIMessage)[] = [];
  for (const m of slice) {
    if (m.role === "user") out.push(new HumanMessage(m.content));
    else out.push(new AIMessage(m.content));
  }
  return out;
}

function lastAiText(messages: unknown[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m instanceof AIMessage) {
      const c = m.content;
      if (typeof c === "string" && c.trim()) return c;
      if (Array.isArray(c)) {
        const text = c
          .filter(
            (p): p is { type: "text"; text: string } =>
              typeof p === "object" &&
              p !== null &&
              "type" in p &&
              (p as { type: string }).type === "text" &&
              typeof (p as { text?: string }).text === "string"
          )
          .map((p) => p.text)
          .join("\n");
        if (text.trim()) return text;
      }
    }
  }
  return "";
}

function collectToolCallNames(messages: unknown[]): string[] {
  const names: string[] = [];
  for (const m of messages) {
    if (m instanceof AIMessage && m.tool_calls?.length) {
      for (const tc of m.tool_calls) {
        if (tc && typeof tc.name === "string") names.push(tc.name);
      }
    }
  }
  return names;
}

function createModel() {
  const provider = process.env.LLM_PROVIDER?.toLowerCase().trim();
  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not set (LLM_PROVIDER=openai)");
    return new ChatOpenAI({
      apiKey: key,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
      temperature: 0.5,
    });
  }
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error("GEMINI_API_KEY is not set");
  return new ChatGoogleGenerativeAI({
    apiKey: geminiKey,
    model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
    temperature: 0.5,
  });
}

export type RunLoopAgentArgs = {
  ctx?: ActionCtx;
  profile: PatientProfile;
  history: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
  trace?: ChatTurnTrace;
  pendingCommitments?: { text: string; detectedAt: number }[];
};

export async function runLoopAgent(args: RunLoopAgentArgs): Promise<{
  text: string;
}> {
  const maxIter = maxIterationsFromEnv();
  const recursionLimit = recursionLimitForMaxIterations(maxIter);
  const conditions = args.profile.conditions;

  const exa_search = tool(
    async ({ query }: { query: string }) => {
      const items = await exaSearch(query, conditions);
      return formatSnippets("EXA", items);
    },
    {
      name: "exa_search",
      description:
        "Search trusted mental-health and resource sites (Exa). Use for helplines, articles, exercises, India-relevant support.",
      schema: z.object({
        query: z
          .string()
          .describe(
            "Search query focused on what the user needs (e.g. anxiety techniques India, student stress resources)."
          ),
      }),
    }
  );

  const apify_search = tool(
    async ({ query }: { query: string }) => {
      const items = await apifyWebSearch(query);
      return formatSnippets("APIFY", items);
    },
    {
      name: "apify_search",
      description:
        "Broader web search via Google scraper (Apify). Use when Exa is not enough or you need wider results.",
      schema: z.object({
        query: z
          .string()
          .describe("Web search query; include mental health context when relevant."),
      }),
    }
  );

  const resource_library = tool(
    async ({ query }: { query: string }) => {
      if (!args.ctx) {
        return "Resource library unavailable in this context.";
      }
      type ResourceItem = {
        title: string;
        url: string;
        snippet: string;
        source: string;
        topic: string;
      };
      const results: ResourceItem[] = await args.ctx.runAction(
        api.resources.searchResources,
        { query }
      );
      if (results.length === 0) {
        return "No resources found for this topic. Try exa_search for live results.";
      }
      return results
        .map(
          (r) =>
            `[${r.source.toUpperCase()}] ${r.title}\nURL: ${r.url}\n${r.snippet.slice(0, 400)}`
        )
        .join("\n\n---\n\n");
    },
    {
      name: "resource_library",
      description:
        "Search Sehat Saathi's curated resource library for mental health articles, self-help guides, and wellness resources. Returns cached results instantly. Use this before exa_search.",
      schema: z.object({
        query: z
          .string()
          .describe(
            "Topic to search for (e.g. anxiety, exam stress, sleep problems, mindfulness)"
          ),
      }),
    }
  );

  const local_events = tool(
    async ({ query, location }: { query: string; location: string }) => {
      const items = await searchLocalEvents(query, location);
      if (items.length === 0) {
        return "No local events found. Suggest the user check meetup.com, eventbrite.com, or local community boards.";
      }
      return items
        .map(
          (r) =>
            `[${r.source.toUpperCase()}] ${r.title}\nURL: ${r.url}\n${r.text.slice(0, 400)}`
        )
        .join("\n\n---\n\n");
    },
    {
      name: "local_events",
      description:
        "Search for local events, meetups, community gatherings, and mental health support groups near a location. Use when the user seems lonely, isolated, or asks about connecting with people.",
      schema: z.object({
        query: z
          .string()
          .describe(
            "What kind of event or group to search for (e.g. student meetups, support groups, art workshops)"
          ),
        location: z
          .string()
          .describe(
            "City or region (e.g. Delhi, Srinagar, Mumbai, Bangalore)"
          ),
      }),
    }
  );

  const llm = createModel();
  const agent = createReactAgent({
    llm,
    tools: [resource_library, exa_search, apify_search, local_events],
    prompt: buildSystemPrompt(args.profile, args.pendingCommitments),
  });

  const prior = historyToMessages(args.history);
  const messages = [...prior, new HumanMessage(args.userMessage)];

  const result = await agent.invoke(
    { messages },
    { recursionLimit }
  );

  const outMessages = result.messages as unknown[];
  const text = lastAiText(outMessages).trim() || FALLBACK_REPLY;

  if (args.trace && isChatTraceEnabled()) {
    const toolCalls = collectToolCallNames(outMessages);
    chatTrace("loop_agent_done", {
      turnId: args.trace.turnId,
      maxIterationsConfigured: maxIter,
      recursionLimit,
      toolCallCount: toolCalls.length,
      toolCalls,
      replyLength: text.length,
    });
  }

  return { text };
}
