"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import { useEffect, useRef, useState } from "react";
import { NotebookPen, X } from "lucide-react";
import styles from "@/styles/components/saathi-chat.module.css";

const MEMORY_LIMIT = 2000;

type Props = {
  anonymousId: string;
  onClose: () => void;
};

export default function MemoryDrawer({ anonymousId, onClose }: Props) {
  const profile = useQuery(api.patients.getProfileByAnonymousId, { anonymousId });
  const updateMemory = useMutation(api.patients.updateMemory);

  const [text, setText] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  // Initialise textarea once profile loads (don't overwrite mid-edit)
  useEffect(() => {
    if (!initialized.current && profile !== undefined) {
      setText(profile?.memoryNote ?? "");
      initialized.current = true;
    }
  }, [profile]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMemory({ anonymousId, memoryNote: text });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setText("");
    setSaving(true);
    try {
      await updateMemory({ anonymousId, memoryNote: "" });
    } finally {
      setSaving(false);
    }
  };

  const charCount = text.length;
  const nearLimit = charCount > MEMORY_LIMIT * 0.85;

  return (
    <div
      className={styles.memoryOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Memory"
    >
      <div className={styles.memoryDrawer}>
        <div className={styles.memoryHeader}>
          <div className={styles.memoryHeaderIcon} aria-hidden>
            <NotebookPen size={18} strokeWidth={2.25} />
          </div>
          <div style={{ flex: 1 }}>
            <p className={styles.memoryTitle}>Memory</p>
            <p className={styles.memorySubtitle}>
              Saathi uses this to remember things about you across sessions.
            </p>
          </div>
          <button
            type="button"
            className={styles.memoryCloseBtn}
            onClick={onClose}
            aria-label="Close memory panel"
          >
            <X size={16} strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        <textarea
          className={styles.memoryTextarea}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MEMORY_LIMIT))}
          placeholder="Nothing remembered yet — Saathi will fill this as you chat, or you can write anything here yourself."
          aria-label="Memory content"
          spellCheck
        />

        <div className={styles.memoryMeta}>
          <span
            className={`${styles.memoryCharCount}${nearLimit ? ` ${styles.memoryCharCountWarn}` : ""}`}
          >
            {charCount} / {MEMORY_LIMIT}
          </span>
          <div className={styles.memoryActions}>
            <button
              type="button"
              className={styles.memoryClearBtn}
              onClick={handleClear}
              disabled={saving || charCount === 0}
            >
              Clear
            </button>
            <button
              type="button"
              className={styles.memorySaveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
