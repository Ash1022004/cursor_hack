"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import styles from "@/styles/components/ui/ChatInterface.module.css";
import { sendAIChat, getChatbotHealth } from "@/services/chat_service";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

type Variant = "compact" | "full";

type Props = {
  variant: Variant;
};

export default function MemorySaathiPanel({ variant }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [domain, setDomain] = useState<
    "stress" | "burnout" | "career" | "relationships"
  >("stress");
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const loginHref = `/login?returnUrl=${encodeURIComponent("/chat/memory")}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setMessages([]);
      return;
    }
    if (messages.length === 0) {
      if (user) {
        setMessages([
          {
            id: "1",
            text: `Hi ${user.firstName}! I'm Sehat-Saathi, your supportive companion. How are you feeling today? 💚`,
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages([
          {
            id: "1",
            text: "Hi there! I'm Sehat-Saathi, your supportive companion. How are you feeling today? 💚",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      }
    }
  }, [user, isAuthenticated, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!inputText.trim() || !isAuthenticated) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);
    try {
      const data = await sendAIChat({
        message: userMessage.text,
        domain,
        update_profile: undefined,
      });
      const botText = data?.reply || "I'm here for you.";
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: "bot",
        timestamp: new Date(),
      };
      const suggestions: string[] | undefined = data?.suggestions;

      setMessages((prev) => {
        const next = [...prev, botMessage];
        if (suggestions && suggestions.length) {
          const sugText = `Suggestions:\n- ${suggestions.join("\n- ")}`;
          next.push({
            id: (Date.now() + 2).toString(),
            text: sugText,
            sender: "bot",
            timestamp: new Date(),
          });
        }
        return next;
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 3).toString(),
          text: "Sorry, I could not connect right now. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const containerClass =
    variant === "compact"
      ? `${styles.chatContainer} ${styles.memoryEmbed}`
      : `${styles.chatContainer} ${styles.memoryFullPage}`;

  if (!isAuthenticated) {
    return (
      <div className={containerClass}>
        <div className={styles.memoryGate}>
          <div className={styles.memoryGateTop}>
            <div className={styles.memoryGateIcon} aria-hidden>
              <Bot size={22} strokeWidth={2} />
            </div>
            <div className={styles.memoryGateTitles}>
              <h2 className={styles.memoryGateTitle}>Sehat-Saathi</h2>
              <p className={styles.memoryGateSubtitle}>Memory · Sign in to continue</p>
            </div>
            {variant === "full" && (
              <Link href="/" className={styles.memoryGateHome}>
                Home
              </Link>
            )}
          </div>
          <div className={styles.memoryGateBody}>
            <p className={styles.memoryGateCopy}>
              Memory mode remembers your conversation when you&apos;re signed in, so
              Saathi can stay consistent with you over time.
            </p>
            <Link href={loginHref} className={styles.memoryGateCta}>
              Sign in
            </Link>
            <p className={styles.memoryGateFoot}>
              Or switch to <strong>Anonymous</strong> in the tab above for a private chat
              without an account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={`${styles.chatHeader} ${styles.chatHeaderMemory}`}>
        <div className={styles.botInfo}>
          <Bot className={styles.botIcon} />
          <div>
            <h3>Sehat-Saathi</h3>
            <span
              className={`${styles.status} ${isOnline ? styles.statusOnline : styles.statusOffline}`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        {variant === "full" && (
          <Link href="/" className={styles.chatHeaderLink}>
            Home
          </Link>
        )}
      </div>

      <div className={styles.domainBar}>
        <label htmlFor="domain-select-memory" className={styles.domainLabel}>
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
          className={styles.domainSelect}
          aria-label="Select conversation topic"
        >
          <option value="stress">Stress</option>
          <option value="burnout">Burnout</option>
          <option value="career">Career</option>
          <option value="relationships">Relationships</option>
        </select>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.sender]}`}
          >
            <div className={styles.messageIcon}>
              {message.sender === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={styles.messageContent}>
              <p>{message.text}</p>
              <span className={styles.timestamp}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className={`${styles.message} ${styles.bot}`}>
            <div className={styles.messageIcon}>
              <Bot size={16} />
            </div>
            <div className={styles.messageContent}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          className={styles.messageInput}
          rows={1}
        />
        <button
          type="button"
          onClick={() => void handleSendMessage()}
          disabled={!inputText.trim()}
          className={styles.sendButton}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
