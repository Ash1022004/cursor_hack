"use client";

import { motion, useReducedMotion } from "framer-motion";
import styles from "@/styles/components/health/HealthHub.module.css";

/** Small looping scale preview for the Relax & Reset card. */
export default function BreathingPreview() {
  const reduce = useReducedMotion();

  return (
    <div className={styles.breathPreview} aria-hidden>
      <motion.div
        className={styles.breathRing}
        animate={reduce ? undefined : { scale: [1, 1.12, 1] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className={styles.breathCore} />
    </div>
  );
}
