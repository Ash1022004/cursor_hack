"use client";

import React, { useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import styles from "@/styles/pages/Contact.module.css";

export default function VerifyMedicinePage() {
  const [loading, setLoading] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [info, setInfo] = useState<Record<string, string> | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setDetected(null);
    setName(null);
    setInfo(null);
    setDisclaimer(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/verify-medicine", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setDetected(typeof data.detected_text === "string" ? data.detected_text : "");
      setName(typeof data.medicine_name === "string" ? data.medicine_name : null);
      setInfo(data.basic_info && typeof data.basic_info === "object" ? (data.basic_info as Record<string, string>) : null);
      setDisclaimer(typeof data.disclaimer === "string" ? data.disclaimer : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Verify medicine label - Sehat-Saathi" description="OCR demo against local reference data.">
      <div className={styles.contact}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Verify medicine label</h1>
              <p className={styles.heroSubtitle}>
                <Link href="/health" className={styles.healthBackLink}>
                  ← Back to Health tools
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className={styles.contactForm}>
          <div className={styles.container}>
            <div className={styles.formContainer}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="image">
                  Upload label image
                </label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  className={styles.input}
                  onChange={onFile}
                  disabled={loading}
                />
              </div>
              {loading && <p className={styles.faqAnswer}>Processing…</p>}
              {error && <p className={`${styles.faqAnswer} ${styles.healthError}`}>{error}</p>}

              {detected !== null && (
                <div className={`${styles.faqItem} ${styles.healthResultSection}`}>
                  <h3 className={styles.faqQuestion}>Detected text</h3>
                  <pre className={styles.faqAnswer}>{detected}</pre>
                </div>
              )}

              {name && (
                <div className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>Matched medicine</h3>
                  <p className={styles.faqAnswer}>{name}</p>
                </div>
              )}

              {info && (
                <div className={styles.faqItem}>
                  <p className={styles.faqAnswer}>
                    <strong>Uses:</strong> {info.uses}
                  </p>
                  <p className={styles.faqAnswer}>
                    <strong>Dosage:</strong> {info.dosage}
                  </p>
                  <p className={styles.faqAnswer}>
                    <strong>Side effects:</strong> {info.sideEffects}
                  </p>
                  <p className={styles.faqAnswer}>
                    <strong>Precautions:</strong> {info.precautions}
                  </p>
                </div>
              )}

              {disclaimer && (
                <div className={styles.faqItem}>
                  <p className={styles.faqAnswer}>{disclaimer}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
