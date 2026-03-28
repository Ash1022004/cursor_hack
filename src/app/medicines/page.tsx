"use client";

import React, { useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import styles from "@/styles/pages/Contact.module.css";

type Med = {
  name: string;
  genericNames: string[];
  uses: string;
  dosage: string;
  sideEffects: string;
  precautions: string;
};

export default function MedicinesPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Med[]>([]);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/medicines?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults((data.results as Med[]) || []);
      setDisclaimer(typeof data.disclaimer === "string" ? data.disclaimer : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Medicine information - Sehat-Saathi" description="Reference information for common medicines.">
      <div className={styles.contact}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Medicine information</h1>
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
              <form onSubmit={search} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="q">
                    Search by name
                  </label>
                  <input
                    id="q"
                    className={styles.input}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="e.g. Paracetamol, Ibuprofen"
                    required
                  />
                </div>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? <div className={styles.spinner} /> : "Search"}
                </button>
              </form>

              {error && <p className={`${styles.faqAnswer} ${styles.healthError}`}>{error}</p>}

              {results.length > 0 && (
                <div className={`${styles.faqGrid} ${styles.healthResultSection}`}>
                  {results.map((m) => (
                    <div key={m.name} className={styles.faqItem}>
                      <h3 className={styles.faqQuestion}>{m.name}</h3>
                      <p className={styles.faqAnswer}>
                        <strong>Also known as:</strong> {m.genericNames.join(", ")}
                      </p>
                      <p className={styles.faqAnswer}>
                        <strong>Uses:</strong> {m.uses}
                      </p>
                      <p className={styles.faqAnswer}>
                        <strong>Dosage:</strong> {m.dosage}
                      </p>
                      <p className={styles.faqAnswer}>
                        <strong>Side effects:</strong> {m.sideEffects}
                      </p>
                      <p className={styles.faqAnswer}>
                        <strong>Precautions:</strong> {m.precautions}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {disclaimer && (
                <div className={`${styles.faqItem} ${styles.healthResultSection}`}>
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
