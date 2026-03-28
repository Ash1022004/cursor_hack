"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ChatBubble from "@/components/saathi/ChatBubble";
import ChatInput from "@/components/saathi/ChatInput";
import CrisisBanner from "@/components/saathi/CrisisBanner";
import MemoryDrawer from "@/components/saathi/MemoryDrawer";
import VoiceJournalButton from "@/components/saathi/VoiceJournalButton";
import SaathiHeaderToolbar from "@/components/saathi/SaathiHeaderToolbar";
import SaathiLanguageGate from "@/components/saathi/SaathiLanguageGate";
import TypingIndicator from "@/components/chat/TypingIndicator";
import styles from "@/styles/components/saathi-chat.module.css";
import { Activity } from "lucide-react";

const WELCOME =
  "Namaste. I am Saathi, your mental health companion. This is a private space — you can share anything here. How are you feeling today?";

type Variant = "compact" | "full";

type Props = {
  variant: Variant;
  /** When true with variant="full", fill Layout main instead of min-height:100vh */
  layoutEmbedded?: boolean;
  /** When true (e.g. floating dock), hide the large compact language strip; use header language menu instead. */
  hideCompactLanguageStrip?: boolean;
  /** Increment to resync anonymous id / language state from localStorage after external changes. */
  languageSyncNonce?: number;
  onNeedsLanguageChange?: (needs: boolean) => void;
};

export default function AnonymousSaathiPanel({
  variant,
  layoutEmbedded = false,
  hideCompactLanguageStrip = false,
  languageSyncNonce,
  onNeedsLanguageChange,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; agentType?: string }[]
  >([]);
  const [sessionId, setSessionId] = useState<Id<"sessions"> | undefined>();
  const [loading, setLoading] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [anonymousId, setAnonymousId] = useState("");
  const [missingConvex, setMissingConvex] = useState(false);
  const [needsLanguage, setNeedsLanguage] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const languageSyncSkipRef = useRef(true);

  const sendMessage = useAction(api.patientChat.sendMessage);
  const getOrCreatePatient = useMutation(api.patients.getOrCreatePatient);
  const patientProfile = useQuery(
    api.patients.getProfileByAnonymousId,
    anonymousId ? { anonymousId } : "skip"
  );

  const syncIdAndWelcome = useCallback(() => {
    const id = localStorage.getItem("saathi_id") ?? "";
    setAnonymousId(id);
    if (id) setNeedsLanguage(false);
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
    }
  }, []);

  const anonSessionKey = anonymousId
    ? `saathi_anon_session_${anonymousId}`
    : null;
  const storedAnonSessionId =
    typeof window !== "undefined" && anonSessionKey
      ? localStorage.getItem(anonSessionKey)
      : null;

  const shouldHydrateAnonSession = Boolean(
    anonymousId && storedAnonSessionId
  );

  const anonSessionDoc = useQuery(
    api.sessions.getSessionForPatient,
    shouldHydrateAnonSession
      ? {
          anonymousId,
          sessionId: storedAnonSessionId as Id<"sessions">,
        }
      : "skip"
  );

  useEffect(() => {
    if (!anonymousId || needsLanguage) return;

    if (shouldHydrateAnonSession && anonSessionDoc === undefined) {
      return;
    }

    if (shouldHydrateAnonSession && anonSessionDoc === null) {
      if (anonSessionKey) localStorage.removeItem(anonSessionKey);
      setSessionId(undefined);
      setMessages([{ role: "assistant", content: WELCOME }]);
      return;
    }

    if (
      anonSessionDoc &&
      anonSessionDoc.messages &&
      anonSessionDoc.messages.length > 0
    ) {
      setMessages(
        anonSessionDoc.messages.map(
          (m: {
            role: "user" | "assistant";
            content: string;
            agentUsed?: string;
          }) => ({
            role: m.role,
            content: m.content,
            agentType: m.agentUsed,
          })
        )
      );
      setSessionId(anonSessionDoc._id);
      return;
    }

    setMessages((prev) =>
      prev.length === 0 ? [{ role: "assistant", content: WELCOME }] : prev
    );
  }, [
    anonymousId,
    needsLanguage,
    shouldHydrateAnonSession,
    anonSessionDoc,
    anonSessionKey,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, needsLanguage]);

  useEffect(() => {
    onNeedsLanguageChange?.(needsLanguage);
  }, [needsLanguage, onNeedsLanguageChange]);

  useEffect(() => {
    if (languageSyncNonce === undefined) return;
    if (languageSyncSkipRef.current) {
      languageSyncSkipRef.current = false;
      return;
    }
    const id =
      typeof window !== "undefined" ? localStorage.getItem("saathi_id") ?? "" : "";
    if (!id) {
      setNeedsLanguage(true);
      setAnonymousId("");
      setMessages([]);
      setSessionId(undefined);
    } else {
      setNeedsLanguage(false);
      syncIdAndWelcome();
    }
  }, [languageSyncNonce, syncIdAndWelcome]);

  const handleLanguageReady = () => {
    syncIdAndWelcome();
  };

  const handlePickLanguage = useCallback(
    async (language: string) => {
      let id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `saathi_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const existing = localStorage.getItem("saathi_id");
      if (existing) id = existing;
      else localStorage.setItem("saathi_id", id);
      await getOrCreatePatient({ anonymousId: id, language });
      setNeedsLanguage(false);
      syncIdAndWelcome();
    },
    [getOrCreatePatient, syncIdAndWelcome]
  );

  const handleChangeLanguage = () => {
    const id = localStorage.getItem("saathi_id");
    if (id) localStorage.removeItem(`saathi_anon_session_${id}`);
    localStorage.removeItem("saathi_id");
    setAnonymousId("");
    setNeedsLanguage(true);
    setMessages([]);
    setSessionId(undefined);
  };

  const handleLeaveFullPageChat = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleCloseFullPageChat = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    if (!anonymousId) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Choose a language from the header: hover or tap the language icon, then pick English, हिंदी, اردو, or کٲشُر.",
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
      localStorage.setItem(
        `saathi_anon_session_${anonymousId}`,
        result.sessionId
      );
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
        <Link href="/saathi" style={{ color: "#7c6fcd" }}>
          Back to Saathi
        </Link>
      </div>
    );
  }

  const surfaceClass =
    variant === "full"
      ? `${styles.surface} ${
          layoutEmbedded
            ? styles.flexColInLayout
            : `${styles.flexColScreen} ${styles.surfaceGradientScreen}`
        }`
      : `${styles.surface} ${styles.flexColCompact}`;

  const showLangHeaderHint =
    needsLanguage &&
    messages.length === 0 &&
    (variant === "full" || (variant === "compact" && hideCompactLanguageStrip));

  return (
    <div className={surfaceClass}>
      {variant === "full" && (
        <header className={`${styles.header} ${styles.headerSurfaceGradient}`}>
          <div className={styles.headerLead}>
            <div className={styles.headerAvatar} aria-hidden>
              <span className={styles.headerHeartbeat}>
                <Activity size={20} strokeWidth={2.5} />
              </span>
            </div>
            <div className={styles.headerBrand}>
              <p className={styles.headerTitle}>Saathi • Your Health Companion</p>
              <p className={styles.headerSub}>Mental health companion · Anonymous</p>
            </div>
          </div>
          <SaathiHeaderToolbar
            mode="anonymous"
            onToggleMode={() => router.push("/chat/memory")}
            centerAction="minimize"
            onCenterClick={handleLeaveFullPageChat}
            onClose={handleCloseFullPageChat}
            languageMenu={{
              onSelectLanguage: handlePickLanguage,
              onRequestClear: handleChangeLanguage,
              needsAttention: needsLanguage,
            }}
            showHomeLink
            onMemoryClick={anonymousId ? () => setMemoryOpen(true) : undefined}
            memoryHasContent={Boolean(patientProfile?.memoryNote)}
          />
        </header>
      )}

      {needsLanguage && variant === "compact" && !hideCompactLanguageStrip && (
        <div className={styles.languageGateStrip}>
          <SaathiLanguageGate onReady={handleLanguageReady} compact />
        </div>
      )}

      {crisisDetected && <CrisisBanner />}

      <div className={styles.messages}>
        {showLangHeaderHint ? (
          <p className={styles.langEmptyHint}>
            Hover or tap the <strong>language icon</strong> in the header to open a compact menu —
            then choose your language to begin.
          </p>
        ) : null}
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
            <div className={styles.voiceJournalSlot}>
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
            </div>
          ) : undefined
        }
      />

      {memoryOpen && anonymousId && (
        <MemoryDrawer
          anonymousId={anonymousId}
          onClose={() => setMemoryOpen(false)}
        />
      )}
    </div>
  );
}
