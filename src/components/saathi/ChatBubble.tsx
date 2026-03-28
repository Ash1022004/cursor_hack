"use client";

import styles from "@/styles/components/saathi-chat.module.css";

const agentLabels: Record<string, string> = {
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
  return (
    <div className={isUser ? styles.rowUser : styles.rowBot}>
      <div style={{ maxWidth: "80%" }}>
        {!isUser && agentType && (
          <p className={styles.agentLabel}>
            {agentLabels[agentType] ?? agentType}
          </p>
        )}
        <div className={isUser ? styles.bubbleUser : styles.bubbleBot}>
          {content}
        </div>
      </div>
    </div>
  );
}
