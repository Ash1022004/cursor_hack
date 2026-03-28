"use node";

import { randomUUID } from "crypto";
import { v } from "convex/values";
import { action, internalAction, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { extractFromMessage } from "./agents/extraction";
import type { PatientProfile } from "./agents/types";
import { assertValidSubjectKey } from "./lib/anonymousId";
import { runLoopAgent } from "./lib/chatAgentGraph";
import {
  anonymousIdSuffix,
  chatTrace,
  isChatTraceEnabled,
  isChatTraceVerbose,
} from "./lib/chatTrace";

const CHAT_AGENT_TYPE = "loop_agent";

type TurnResult = {
  reply: string;
  response: string;
  agentType: string;
  sessionId: Id<"sessions">;
  crisisDetected: boolean;
  suggestions: string[];
};

async function executeTurn(
  ctx: ActionCtx,
  args: {
    anonymousId: string;
    sessionId?: Id<"sessions">;
    message: string;
    language?: string;
  }
): Promise<TurnResult> {
  const traceEnabled = isChatTraceEnabled();
  const turnStart = traceEnabled ? Date.now() : 0;
  const turnId = traceEnabled ? randomUUID() : "";
  const trace = traceEnabled ? { turnId } : undefined;

  assertValidSubjectKey(args.anonymousId);

  if (traceEnabled) {
    chatTrace("turn_start", {
      turnId,
      anonymousIdSuffix: anonymousIdSuffix(args.anonymousId),
      sessionIdPresent: Boolean(args.sessionId),
      messageLength: args.message.length,
      ...(isChatTraceVerbose()
        ? { messagePreview: args.message.slice(0, 80) }
        : {}),
    });
  }

  let patient: Doc<"patients"> | null = await ctx.runQuery(
    internal.patients.getByAnonymousId,
    {
      anonymousId: args.anonymousId,
    }
  );
  let patientCreated = false;
  if (!patient) {
    patientCreated = true;
    await ctx.runMutation(internal.patients.createPatientInternal, {
      anonymousId: args.anonymousId,
      language: args.language,
    });
    patient = await ctx.runQuery(internal.patients.getByAnonymousId, {
      anonymousId: args.anonymousId,
    });
  }
  if (!patient) {
    throw new Error("Patient not found");
  }

  if (traceEnabled) {
    chatTrace("patient_ready", {
      turnId,
      patientId: patient._id,
      patientCreated,
    });
  }

  let sessionId = args.sessionId;
  let history: { role: "user" | "assistant"; content: string }[] = [];
  let reusedSession = false;

  if (sessionId) {
    const session = await ctx.runQuery(internal.sessions.getSession, {
      sessionId,
    });
    if (session && session.patientId === patient._id) {
      history = session.messages.map(
        (m: { role: "user" | "assistant"; content: string }) => ({
          role: m.role,
          content: m.content,
        })
      );
      reusedSession = true;
    } else {
      sessionId = undefined;
    }
  }

  if (traceEnabled) {
    chatTrace("session_history", {
      turnId,
      messageCount: history.length,
      reusedSession,
    });
  }

  const profile: PatientProfile = {
    anonymousId: patient.anonymousId,
    age: patient.age,
    conditions: patient.conditions,
    medications: patient.medications,
    triggers: patient.triggers,
    copingPatterns: patient.copingPatterns,
    phqScore: patient.phqScore,
    gadScore: patient.gadScore,
    crisisFlag: patient.crisisFlag,
    totalSessions: patient.totalSessions,
    language: patient.language,
  };

  // Fetch pending commitments for follow-up injection
  const pendingCommitments: { text: string; detectedAt: number }[] =
    await ctx.runQuery(internal.commitments.getPendingForPatient, {
      patientId: patient._id,
    });

  if (traceEnabled) {
    chatTrace("parallel_phase_start", { turnId });
  }

  const [{ text: assistantText }, extracted] = await Promise.all([
    runLoopAgent({
      ctx,
      profile,
      history,
      userMessage: args.message,
      trace,
      pendingCommitments,
    }),
    extractFromMessage(args.message, trace),
  ]);

  if (traceEnabled) {
    chatTrace("parallel_phase_end", {
      turnId,
      agentType: CHAT_AGENT_TYPE,
      extractionCrisis: extracted.crisisSignal,
      extractionMoodScore: extracted.moodScore,
    });
  }

  let newSessionId: Id<"sessions"> | undefined = sessionId;
  if (!newSessionId) {
    newSessionId = await ctx.runMutation(internal.sessions.createSession, {
      patientId: patient._id,
    });
    await ctx.runMutation(internal.patients.incrementSessions, {
      patientId: patient._id,
    });
    if (traceEnabled) {
      chatTrace("session_created", { turnId, sessionId: newSessionId });
    }
  }

  if (!newSessionId) {
    throw new Error("Session could not be created");
  }

  const sessionIdForMessages: Id<"sessions"> = newSessionId;

  if (traceEnabled) {
    chatTrace("persist_messages", { turnId, sessionId: sessionIdForMessages });
  }
  await ctx.runMutation(internal.sessions.addMessages, {
    sessionId: sessionIdForMessages,
    userMessage: args.message,
    assistantMessage: assistantText,
    agentUsed: CHAT_AGENT_TYPE,
  });

  if (traceEnabled) {
    chatTrace("persist_extraction", { turnId });
  }
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

  if (traceEnabled) {
    chatTrace("turn_end", {
      turnId,
      totalDurationMs: Date.now() - turnStart,
      agentType: CHAT_AGENT_TYPE,
      crisisDetected: extracted.crisisSignal,
    });
  }

  return {
    reply: assistantText,
    response: assistantText,
    agentType: CHAT_AGENT_TYPE,
    sessionId: sessionIdForMessages,
    crisisDetected: extracted.crisisSignal,
    suggestions: [] as string[],
  };
}

/** Anonymous or client-identified patient chat (Convex React). */
export const sendMessage = action({
  args: {
    anonymousId: v.string(),
    sessionId: v.optional(v.id("sessions")),
    message: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<TurnResult> => executeTurn(ctx, args),
});

/** Internal: JWT student chat and HTTP routes. */
export const runTurn = internalAction({
  args: {
    anonymousId: v.string(),
    sessionId: v.optional(v.id("sessions")),
    message: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<TurnResult> => executeTurn(ctx, args),
});
