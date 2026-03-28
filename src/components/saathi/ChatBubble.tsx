"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot } from "lucide-react";
import styles from "@/styles/components/saathi-chat.module.css";

const agentLabels: Record<string, string> = {
  loop_agent: "Saathi",
  empathy: "Listening",
  screening: "Assessment",
  mood: "Mood log",
  crisis: "Crisis support",
  resource: "Resources",
};

interface Props {
  role: "user" | "assistant";
  content: string;
  agentType?: string;
}

export default function ChatBubble({ role, content, agentType }: Props) {
  const isUser = role === "user";
  const reduce = useReducedMotion();

  return (
    <div className={isUser ? styles.rowUser : styles.rowBot}>
      <div className={styles.bubbleCol}>
        {!isUser && agentType && (
          <p className={styles.agentLabel}>
            {agentLabels[agentType] ?? agentType}
          </p>
        )}
        <motion.div
          className={isUser ? styles.bubbleUser : styles.bubbleBot}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
        >
          {!isUser && (
            <span className={styles.botIcon} aria-hidden>
              <Bot size={16} strokeWidth={2} />
            </span>
          )}
          <span className={styles.bubbleText}>{content}</span>
        </motion.div>
      </div>
    </div>
  );
}
