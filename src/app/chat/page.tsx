"use client";

import { useAction } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ChatBubble from "@/components/saathi/ChatBubble";
import ChatInput from "@/components/saathi/ChatInput";
import CrisisBanner from "@/components/saathi/CrisisBanner";
import styles from "@/styles/components/saathi-chat.module.css";

export default function AnonymousChatPage() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; agentType?: string }[]
  >([]);
  const [sessionId, setSessionId] = useState<Id<"sessions"> | undefined>();
  const [loading, setLoading] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [anonymousId, setAnonymousId] = useState("");
  const [missingConvex, setMissingConvex] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = useAction(api.patientChat.sendMessage);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      setMissingConvex(true);
      return;
    }
    const id = localStorage.getItem("saathi_id") ?? "";
    setAnonymousId(id);
    setMessages([
      {
        role: "assistant",
        content:
          "Namaste. I am Saathi, your mental health companion. This is a private space — you can share anything here. How are you feeling today?",
      },
    ]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    if (!anonymousId) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Please start from the Saathi page to choose a language first.",
        },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const result = await sendMessage({
        anonymousId,
        sessionId,
        message: text,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.response,
          agentType: result.agentType,
        },
      ]);
      setSessionId(result.sessionId);
      if (result.crisisDetected) setCrisisDetected(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I am having trouble connecting. Check Convex env (GEMINI_API_KEY or OPENAI_API_KEY with LLM_PROVIDER) and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (missingConvex) {
    return (
      <div
        className={styles.onboarding}
        style={{ textAlign: "center", gap: 16 }}
      >
        <p style={{ color: "#2d2d2d", maxWidth: 400 }}>
          Set <code>NEXT_PUBLIC_CONVEX_URL</code> in <code>.env.local</code> to
          enable anonymous chat.
        </p>
        <Link href="/saathi" style={{ color: "#7c6fcd" }}>
          Back to Saathi
        </Link>
      </div>
    );
  }

  return (
    <div className={`${styles.surface} ${styles.flexColScreen}`}>
      <header className={styles.header}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#7c6fcd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>S</span>
        </div>
        <div style={{ marginLeft: 12, flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#2d2d2d" }}>
            Saathi
          </p>
          <p style={{ fontSize: 12, color: "#8a8a8a" }}>
            Mental health companion · Anonymous
          </p>
        </div>
        <Link
          href="/saathi"
          style={{
            fontSize: 12,
            color: "#7c6fcd",
            border: "1px solid #7c6fcd",
            borderRadius: 999,
            padding: "4px 12px",
            marginRight: 8,
            textDecoration: "none",
          }}
        >
          Language
        </Link>
        <Link href="/" style={{ fontSize: 12, color: "#6b6b6b" }}>
          Home
        </Link>
      </header>

      {crisisDetected && <CrisisBanner />}

      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            role={msg.role}
            content={msg.content}
            agentType={msg.agentType}
          />
        ))}
        {loading && (
          <div style={{ padding: "8px 16px" }}>
            <span style={{ fontSize: 12, color: "#8a8a8a" }}>
              Saathi is thinking…
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
