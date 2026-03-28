import type { HttpRouter } from "convex/server";
import { httpAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { json, verifyAuth } from "../common";

export function registerUserChatRoutes(http: HttpRouter): void {
  http.route({
    path: "/api/user/chat/ai",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      if (!auth) {
        return json({ message: "No token Provided" }, 401);
      }
      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return json({ error: "message is required" }, 400);
      }
      const message = typeof body.message === "string" ? body.message : "";
      if (!message) {
        return json({ error: "message is required" }, 400);
      }
      const anonymousId = `jwt:${auth.userId}`;
      const sessionIdRaw = body.sessionId;
      const sessionId =
        typeof sessionIdRaw === "string" && sessionIdRaw.length > 0
          ? (sessionIdRaw as Id<"sessions">)
          : undefined;
      try {
        const data = await ctx.runAction(internal.patientChat.runTurn, {
          anonymousId,
          sessionId,
          message,
        });
        return json({
          reply: data.reply,
          response: data.response,
          agentType: data.agentType,
          sessionId: data.sessionId,
          crisisDetected: data.crisisDetected,
          suggestions: data.suggestions,
        });
      } catch {
        return json({ error: "Failed to get AI response" }, 500);
      }
    }),
  });

  http.route({
    path: "/api/user/chat/counsellor",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
      const auth = await verifyAuth(ctx, request);
      if (!auth) {
        return json({ message: "No token Provided" }, 401);
      }
      return new Response("chat with counsellor", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }),
  });
}
