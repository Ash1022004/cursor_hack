"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import RippleSurface from "@/components/ui/RippleSurface";
import styles from "@/styles/components/saathi-chat.module.css";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  micSlot?: ReactNode;
}

export default function ChatInput({ onSend, disabled, micSlot }: Props) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className={styles.inputBar}>
      <div className={styles.inputRow}>
        <div className={styles.textareaWrap}>
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
            disabled={disabled}
          />
        </div>
        {micSlot}
        <RippleSurface className={styles.sendRipple} disabled={disabled || !text.trim()}>
          <motion.button
            type="button"
            onClick={handleSend}
            disabled={disabled || !text.trim()}
            className={styles.sendBtn}
            aria-label="Send message"
            whileHover={disabled || !text.trim() ? undefined : { scale: 1.06 }}
            whileTap={disabled || !text.trim() ? undefined : { scale: 0.94 }}
          >
            <Send size={18} strokeWidth={2.25} />
          </motion.button>
        </RippleSurface>
      </div>
      <p className={styles.hint}>
        Not a substitute for professional care · iCall: 9152987821
      </p>
    </div>
  );
}
