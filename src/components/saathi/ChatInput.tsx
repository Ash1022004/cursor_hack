"use client";

import { useState } from "react";
import styles from "@/styles/components/saathi-chat.module.css";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className={styles.inputBar}>
      <div className={styles.inputRow}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Share what's on your mind…"
          rows={1}
          className={styles.textarea}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className={styles.sendBtn}
          aria-label="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <p className={styles.hint}>
        Not a substitute for professional care · iCall: 9152987821
      </p>
    </div>
  );
}
