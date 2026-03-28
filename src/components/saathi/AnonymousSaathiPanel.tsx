"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatBubble from "@/components/saathi/ChatBubble";
import ChatInput from "@/components/saathi/ChatInput";
import CrisisBanner from "@/components/saathi/CrisisBanner";
import MoodSparkline from "@/components/saathi/MoodSparkline";
import VoiceJournalButton from "@/components/saathi/VoiceJournalButton";
import SaathiLanguageGate from "@/components/saathi/SaathiLanguageGate";
import TypingIndicator from "@/components/chat/TypingIndicator";
import styles from "@/styles/components/saathi-chat.module.css";
import { Activity } from "lucide-react";

const WELCOME =
  "Namaste. I am Saathi, your mental health companion. This is a private space — you can share anything here. How are you feeling today?";

type Variant = "compact" | "full";

type Props = {
  variant: Variant;
};

export default function AnonymousSaathiPanel({ variant }: Props) {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; agentType?: string }[]
  >([]);
  const [sessionId, setSessionId] = useState<Id<"sessions"> | undefined>();
  const [loading, setLoading] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [anonymousId, setAnonymousId] = useState("");
  const [missingConvex, setMissingConvex] = useState(false);
  const [needsLanguage, setNeedsLanguage] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = useAction(api.patientChat.sendMessage);
  const moodData = useQuery(
    api.moodLogs.getRecentForPatient,
    anonymousId ? { anonymousId } : "skip"
  );

  const syncIdAndWelcome = useCallback(() => {
    const id = localStorage.getItem("saathi_id") ?? "";
    setAnonymousId(id);
    if (id) {
      setNeedsLanguage(false);
      setMessages((prev) =>
        prev.length === 0
          ? [{ role: "assistant" as const, content: WELCOME }]
          : prev
      );
    }
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      setMissingConvex(true);
      return;
    }
    const id = localStorage.getItem("saathi_id") ?? "";
    if (!id) {
      setNeedsLanguage(true);
      setAnonymousId("");
      setMessages([]);
    } else {
      setAnonymousId(id);
      setNeedsLanguage(false);
      setMessages([{ role: "assistant", content: WELCOME }]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, needsLanguage]);

  const handleLanguageReady = () => {
    syncIdAndWelcome();
  };

  const handleChangeLanguage = () => {
    localStorage.removeItem("saathi_id");
    setAnonymousId("");
    setNeedsLanguage(true);
    setMessages([]);
    setSessionId(undefined);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    if (!anonymousId) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Choose a language above to start chatting.",
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
        style={{ textAlign: "center", gap: 16, minHeight: variant === "compact" ? 200 : undefined }}
      >
        <p style={{ color: "#2d2d2d", maxWidth: 400 }}>
          Set <code>NEXT_PUBLIC_CONVEX_URL</code> in <code>.env.local</code> to
          enable anonymous chat.
        </p>
        <Link href="/chat" style={{ color: "#7c6fcd" }}>
          Back to Saathi
        </Link>
      </div>
    );
  }

  const surfaceClass =
    variant === "full"
      ? `${styles.surface} ${styles.flexColScreen}`
      : `${styles.surface} ${styles.flexColCompact}`;

  return (
    <div className={surfaceClass}>
      {variant === "full" && (
        <header className={styles.header}>
          <div className={styles.headerAvatar} aria-hidden>
            <span className={styles.headerHeartbeat}>
              <Activity size={20} strokeWidth={2.5} />
            </span>
          </div>
          <div className={styles.headerBrand}>
            <p className={styles.headerTitle}>Saathi • Your Health Companion</p>
            <p className={styles.headerSub}>Mental health companion · Anonymous</p>
          </div>
          <button
            type="button"
            onClick={handleChangeLanguage}
            className={styles.headerLink}
            style={{ cursor: "pointer", fontFamily: "inherit" }}
          >
            Language
          </button>
          <Link href="/" className={styles.headerLinkMuted}>
            Home
          </Link>
        </header>
      )}

      {moodData && moodData.length >= 2 && (
        <div style={{ padding: "6px 16px", borderBottom: "1px solid #e8e4de", background: "#fff" }}>
          <MoodSparkline data={moodData} />
        </div>
      )}

      {needsLanguage && (
        <div
          style={{
            flexShrink: 0,
            borderBottom: "1px solid #e8e4de",
            background: "#fff",
          }}
        >
          <SaathiLanguageGate onReady={handleLanguageReady} compact={variant === "compact"} />
        </div>
      )}

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
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={loading || needsLanguage}
        micSlot={
          anonymousId ? (
            <VoiceJournalButton
              anonymousId={anonymousId}
              disabled={loading || needsLanguage}
              onResult={(result) => {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "user" as const,
                    content: `[Voice Journal] ${result.transcription}`,
                  },
                  {
                    role: "assistant" as const,
                    content: result.summary,
                  },
                ]);
                if (result.crisisDetected) setCrisisDetected(true);
              }}
            />
          ) : undefined
        }
      />
    </div>
  );
}
