"use client";

import React from "react";
import styles from "./TypingIndicator.module.css";

/**
 * "Saathi is typing..." with three bouncing dots (respects reduced motion via CSS).
 */
export default function TypingIndicator() {
  return (
    <div className={styles.row} role="status" aria-live="polite">
      <span className={styles.label}>Saathi is typing</span>
      <span className={styles.dots} aria-hidden>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
    </div>
  );
}
