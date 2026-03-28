"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
          <div className={styles.bubbleText}>
            {isUser ? (
              <span className={styles.bubblePlain}>{content}</span>
            ) : (
              <div className={styles.bubbleMarkdown}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children, ...rest }) => (
                      <a
                        {...rest}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
