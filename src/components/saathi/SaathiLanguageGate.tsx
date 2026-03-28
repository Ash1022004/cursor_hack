"use client";

import { useMutation } from "convex/react";
import { Globe } from "lucide-react";
import { api } from "@cvx/_generated/api";
import styles from "@/styles/components/saathi-chat.module.css";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "ur", label: "اردو" },
  { code: "ks", label: "کٲشُر" },
] as const;

type Props = {
  onReady: () => void;
  compact?: boolean;
};

export default function SaathiLanguageGate({ onReady, compact }: Props) {
  const getOrCreate = useMutation(api.patients.getOrCreatePatient);

  const handleStart = async (language: string) => {
    let id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `saathi_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const existing = localStorage.getItem("saathi_id");
    if (existing) id = existing;
    else localStorage.setItem("saathi_id", id);
    await getOrCreate({ anonymousId: id, language });
    onReady();
  };

  return (
    <div
      className={`${styles.langGate} ${compact ? styles.langGateCompact : styles.langGateCenter}`}
    >
      {compact ? (
        <p className={styles.langPromptCompact}>
          Choose your language / زبان منتخب کریں
        </p>
      ) : (
        <div className={styles.langPromptRow}>
          <Globe className={styles.langPromptIcon} size={20} strokeWidth={2} aria-hidden />
          <p className={styles.langPrompt}>
            Choose your language / زبان منتخب کریں
          </p>
        </div>
      )}
      <div className={styles.langGrid}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => void handleStart(lang.code)}
            className={`${styles.langBtn} ${compact ? styles.langBtnCompact : ""}`}
          >
            {lang.label}
          </button>
        ))}
      </div>
      {!compact && (
        <p className={styles.langCrisis}>
          In crisis right now?{" "}
          <a href="tel:9152987821" className={styles.langCrisisLink}>
            Call iCall: 9152987821
          </a>
        </p>
      )}
    </div>
  );
}
