"use client";

import { useAction } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";
import ChatBubble from "@/components/saathi/ChatBubble";
import ChatInput from "@/components/saathi/ChatInput";
import CrisisBanner from "@/components/saathi/CrisisBanner";
import SaathiHeaderToolbar from "@/components/saathi/SaathiHeaderToolbar";
import VoiceJournalButton from "@/components/saathi/VoiceJournalButton";
import TypingIndicator from "@/components/chat/TypingIndicator";
import styles from "@/styles/components/saathi-chat.module.css";
import uiStyles from "@/styles/components/ui/ChatInterface.module.css";
import { useAuth } from "@/context/AuthContext";
import { getChatbotHealth } from "@/services/chat_service";

type Variant = "compact" | "full";

type Props = {
  variant: Variant;
};

export default function MemorySaathiPanel({ variant }: Props) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; agentType?: string }[]
  >([]);
  const [sessionId, setSessionId] = useState<Id<"sessions"> | undefined>();
  const [loading, setLoading] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [domain, setDomain] = useState<
    "stress" | "burnout" | "career" | "relationships"
  >("stress");
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = useAction(api.patientChat.sendMessage);

  const loginHref = `/login?returnUrl=${encodeURIComponent("/chat/memory")}`;

  const anonymousId = user ? `jwt:${user._id}` : "";

  const WELCOME = user
    ? `Hi ${user.firstName}! I'm Saathi, your mental health companion. Your conversations are remembered so I can support you better over time. How are you feeling today?`
    : "Hi there! I'm Saathi, your mental health companion. How are you feeling today?";

  useEffect(() => {
    if (isAuthenticated && messages.length === 0) {
      setMessages([{ role: "assistant", content: WELCOME }]);
    }
  }, [isAuthenticated, messages.length, WELCOME]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!anonymousId) return;
    const stored = localStorage.getItem(`saathi_memory_session_${anonymousId}`);
    if (stored) {
      setSessionId(stored as Id<"sessions">);
    }
  }, [anonymousId]);

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

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const ok = await getChatbotHealth();
      if (mounted) setIsOnline(ok);
    };
    void check();
    const id = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || loading || !anonymousId) return;

      const displayText = text.trim();
      const outbound =
        domain === "stress"
          ? displayText
          : `[Topic: ${domain}] ${displayText}`;

      setMessages((prev) => [...prev, { role: "user", content: displayText }]);
      setLoading(true);

      try {
        const result = await sendMessage({
          anonymousId,
          sessionId,
          message: outbound,
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
          `saathi_memory_session_${anonymousId}`,
          result.sessionId
        );
        if (result.crisisDetected) setCrisisDetected(true);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm having trouble connecting right now. Please try again in a moment.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, anonymousId, sessionId, sendMessage, domain]
  );

  const containerClass =
    variant === "compact"
      ? `${uiStyles.chatContainer} ${uiStyles.memoryEmbed}`
      : `${uiStyles.chatContainer} ${uiStyles.memoryFullPage}`;

  if (!isAuthenticated) {
    return (
      <div className={containerClass}>
        <div className={uiStyles.memoryGate}>
          <div className={uiStyles.memoryGateTop}>
            <div className={uiStyles.memoryGateIcon} aria-hidden>
              <Bot size={22} strokeWidth={2} />
            </div>
            <div className={uiStyles.memoryGateTitles}>
              <h2 className={uiStyles.memoryGateTitle}>Sehat-Saathi</h2>
              <p className={uiStyles.memoryGateSubtitle}>Memory · Sign in to continue</p>
            </div>
            {variant === "full" && (
              <Link href="/" className={uiStyles.memoryGateHome}>
                Home
              </Link>
            )}
          </div>
          <div className={uiStyles.memoryGateBody}>
            <p className={uiStyles.memoryGateCopy}>
              Memory mode remembers your conversation when you&apos;re signed in, so Saathi can
              stay consistent with you over time.
            </p>
            <Link href={loginHref} className={uiStyles.memoryGateCta}>
              Sign in
            </Link>
            <p className={uiStyles.memoryGateFoot}>
              Or tap the <strong>ghost icon</strong> in the chat header for Anonymous chat without
              an account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={`${uiStyles.chatHeader} ${uiStyles.chatHeaderMemory}`}>
        <div className={uiStyles.botInfo}>
          <Bot className={uiStyles.botIcon} />
          <div>
            <h3>Sehat-Saathi</h3>
            <span
              className={`${uiStyles.status} ${isOnline ? uiStyles.statusOnline : uiStyles.statusOffline}`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        {variant === "full" && (
          <SaathiHeaderToolbar
            chrome="onGradient"
            mode="memory"
            onToggleMode={() => router.push("/chat")}
            centerAction="minimize"
            onCenterClick={handleLeaveFullPageChat}
            onClose={handleCloseFullPageChat}
            showHomeLink
          />
        )}
      </div>

      <div className={uiStyles.domainBar}>
        <label htmlFor="domain-select-memory" className={uiStyles.domainLabel}>
          Topic:
        </label>
        <select
          id="domain-select-memory"
          value={domain}
          onChange={(e) =>
            setDomain(
              e.target.value as "stress" | "burnout" | "career" | "relationships"
            )
          }
          className={uiStyles.domainSelect}
          aria-label="Select conversation topic"
        >
          <option value="stress">Stress</option>
          <option value="burnout">Burnout</option>
          <option value="career">Career</option>
          <option value="relationships">Relationships</option>
        </select>
      </div>

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
        disabled={loading}
        micSlot={
          anonymousId ? (
            <VoiceJournalButton
              anonymousId={anonymousId}
              disabled={loading}
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
