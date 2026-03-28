"use node";

import { v } from "convex/values";
import { action, internalAction, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { extractFromMessage } from "./agents/extraction";
import { supervisor } from "./agents/supervisor";
import type { PatientProfile } from "./agents/types";

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
  let patient: Doc<"patients"> | null = await ctx.runQuery(
    internal.patients.getByAnonymousId,
    {
      anonymousId: args.anonymousId,
    }
  );
  if (!patient) {
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

  let sessionId = args.sessionId;
  let history: { role: "user" | "assistant"; content: string }[] = [];

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
    } else {
      sessionId = undefined;
    }
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

  const [supervisorResult, extracted] = await Promise.all([
    supervisor(profile, history, args.message),
    extractFromMessage(args.message),
  ]);

  let newSessionId: Id<"sessions"> | undefined = sessionId;
  if (!newSessionId) {
    newSessionId = await ctx.runMutation(internal.sessions.createSession, {
      patientId: patient._id,
    });
    await ctx.runMutation(internal.patients.incrementSessions, {
      patientId: patient._id,
    });
  }

  if (!newSessionId) {
    throw new Error("Session could not be created");
  }

  const sessionIdForMessages: Id<"sessions"> = newSessionId;

  await ctx.runMutation(internal.sessions.addMessages, {
    sessionId: sessionIdForMessages,
    userMessage: args.message,
    assistantMessage: supervisorResult.response,
    agentUsed: supervisorResult.agentType,
  });

  await ctx.runMutation(internal.patients.updateFromExtraction, {
    patientId: patient._id,
    conditions: extracted.conditions,
    medications: extracted.medications,
    triggers: extracted.triggers,
    copingPatterns: extracted.copingPatterns,
    crisisSignal: extracted.crisisSignal,
    moodScore: extracted.moodScore,
    dominantEmotion: extracted.dominantEmotion,
  });

  return {
    reply: supervisorResult.response,
    response: supervisorResult.response,
    agentType: supervisorResult.agentType,
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
