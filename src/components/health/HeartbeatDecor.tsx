"use client";

import styles from "@/styles/components/health/HeartbeatDecor.module.css";

/** Subtle looping ECG-style line for results / calm medical context */
export default function HeartbeatDecor({ className }: { className?: string }) {
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")} aria-hidden>
      <svg className={styles.svg} viewBox="0 0 280 40" preserveAspectRatio="xMidYMid meet">
        <path
          className={styles.path}
          d="M4 20 L40 20 L52 6 L64 34 L76 10 L88 26 L100 20 L276 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
