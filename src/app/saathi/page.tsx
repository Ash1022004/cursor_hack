"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Heart } from "lucide-react";
import SaathiLanguageGate from "@/components/saathi/SaathiLanguageGate";
import styles from "@/styles/components/saathi-chat.module.css";

export default function SaathiOnboardingPage() {
  const router = useRouter();

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <main className={styles.onboarding}>
        <div className={styles.onboardingInner}>
          <p className={styles.saathiMissing}>
            Add <code>NEXT_PUBLIC_CONVEX_URL</code> to <code>.env.local</code> (your{" "}
            <code>.convex.cloud</code> URL) to use anonymous Saathi.
          </p>
          <Link href="/" className={styles.saathiHomeLink}>
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.onboarding}>
      <div className={styles.onboardingInner}>
        <div className={styles.saathiBrand}>
          <div className={styles.saathiBrandIcons} aria-hidden>
            <Heart size={20} strokeWidth={2} color="var(--primary-500)" />
            <Activity size={20} strokeWidth={2} color="var(--secondary-500)" />
          </div>
          <h1 className={styles.saathiTitle}>Sehat Saathi</h1>
          <p className={styles.saathiScript}>सेहत साथی · صحت ساتھی</p>
          <p className={styles.saathiTagline}>
            A safe, anonymous space to talk about how you feel. No account needed.
          </p>
        </div>

        <div className={styles.saathiPrivacyCard}>
          <p className={styles.saathiPrivacyTitle}>Your privacy</p>
          <p className={styles.saathiPrivacyBody}>
            An anonymous ID on this device links your chats. Convex stores session history when
            configured.
          </p>
        </div>

        <div className={styles.saathiGateSlot}>
          <SaathiLanguageGate onReady={() => router.push("/chat")} compact={false} />
        </div>

        <p className={styles.saathiFootHint}>
          You can also open chat anytime from the chat icon (bottom-right).
        </p>
      </div>
    </main>
  );
}
