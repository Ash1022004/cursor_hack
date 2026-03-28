"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@cvx/_generated/api";
import styles from "@/styles/components/saathi-chat.module.css";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "ur", label: "اردو" },
  { code: "ks", label: "کٲشُر" },
] as const;

export default function SaathiOnboardingPage() {
  const router = useRouter();
  const getOrCreate = useMutation(api.patients.getOrCreatePatient);

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <main className={styles.onboarding}>
        <div className={styles.onboardingInner}>
          <p style={{ color: "#2d2d2d", marginBottom: 16 }}>
            Add <code>NEXT_PUBLIC_CONVEX_URL</code> to <code>.env.local</code>{" "}
            (your <code>.convex.cloud</code> URL) to use anonymous Saathi.
          </p>
          <Link href="/" style={{ color: "#7c6fcd" }}>
            Home
          </Link>
        </div>
      </main>
    );
  }

  const handleStart = async (language: string) => {
    let id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `saathi_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const existing = localStorage.getItem("saathi_id");
    if (existing) id = existing;
    else localStorage.setItem("saathi_id", id);
    await getOrCreate({ anonymousId: id, language });
    router.push("/chat");
  };

  return (
    <main className={styles.onboarding}>
      <div className={styles.onboardingInner}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: "2.25rem",
              fontWeight: 500,
              color: "#2d2d2d",
              letterSpacing: "-0.02em",
            }}
          >
            Sehat Saathi
          </h1>
          <p style={{ color: "#6b6b6b", fontSize: "1.125rem", marginTop: 8 }}>
            सेहत साथی · صحت ساتھی
          </p>
          <p
            style={{
              color: "#8a8a8a",
              fontSize: "0.875rem",
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            A safe, anonymous space to talk about how you feel. No account
            needed.
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 16,
            border: "1px solid #e8e4de",
            textAlign: "left",
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 12, color: "#6b6b6b" }}>Your privacy</p>
          <p style={{ fontSize: 12, color: "#8a8a8a", marginTop: 4 }}>
            An anonymous ID on this device links your chats. Convex stores
            session history when configured.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: "#6b6b6b", marginBottom: 12 }}>
            Choose your language / زبان منتخب کریں
          </p>
          <div className={styles.langGrid}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => void handleStart(lang.code)}
                className={styles.langBtn}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: "#8a8a8a" }}>
          In crisis right now?{" "}
          <a href="tel:9152987821" style={{ color: "#7c6fcd" }}>
            Call iCall: 9152987821
          </a>
        </p>
      </div>
    </main>
  );
}
