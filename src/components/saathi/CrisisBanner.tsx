"use client";

import styles from "@/styles/components/saathi-chat.module.css";

export default function CrisisBanner() {
  return (
    <div className={styles.crisis}>
      <p className={styles.crisisTitle}>We are concerned about your safety</p>
      <p className={styles.crisisSub}>
        Please reach out to a real person right now:
      </p>
      <div className={styles.crisisActions}>
        <a href="tel:9152987821" className={styles.crisisBtnPrimary}>
          Call iCall: 9152987821
        </a>
        <a href="tel:18602662345" className={styles.crisisBtnOutline}>
          Vandrevala: 1860-266-2345
        </a>
      </div>
    </div>
  );
}
