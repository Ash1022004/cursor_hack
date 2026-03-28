"use client";

import React, { useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import styles from "@/styles/pages/Contact.module.css";

export default function SymptomCheckPage() {
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/symptom-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms,
          age: Number(age),
          gender,
          duration,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || "Request failed");
      setResult(data as Record<string, unknown>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Symptom check - Sehat-Saathi" description="General symptom guidance (educational only).">
      <div className={styles.contact}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Symptom check</h1>
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
              <form onSubmit={onSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="symptoms">
                    Symptoms
                  </label>
                  <textarea
                    id="symptoms"
                    className={styles.textarea}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    required
                    placeholder="Describe your symptoms (e.g. fever, sore throat)"
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="age">
                      Age
                    </label>
                    <input
                      id="age"
                      type="number"
                      min={0}
                      max={120}
                      className={styles.input}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="gender">
                      Gender
                    </label>
                    <input
                      id="gender"
                      className={styles.input}
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      required
                      placeholder="As you identify / clinical context"
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="duration">
                    Duration
                  </label>
                  <input
                    id="duration"
                    className={styles.input}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    placeholder="e.g. 3 days"
                  />
                </div>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? <div className={styles.spinner} /> : "Check"}
                </button>
              </form>

              {error && <p className={`${styles.faqAnswer} ${styles.healthError}`}>{error}</p>}

              {result && (
                <div className={`${styles.faqGrid} ${styles.healthResultSection}`}>
                  <div className={styles.faqItem}>
                    <h3 className={styles.faqQuestion}>Possible conditions</h3>
                    <ul className={styles.faqAnswer}>
                      {(result.possible_conditions as string[])?.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.faqItem}>
                    <h3 className={styles.faqQuestion}>Suggested medicines (generic)</h3>
                    {(result.suggested_medicines as { generic: string; note: string }[])?.map((m) => (
                      <p key={m.generic} className={styles.faqAnswer}>
                        <strong>{m.generic}</strong> — {m.note}
                      </p>
                    ))}
                  </div>
                  <div className={styles.faqItem}>
                    <h3 className={styles.faqQuestion}>Advice</h3>
                    <p className={styles.faqAnswer}>{String(result.advice)}</p>
                  </div>
                  <div className={styles.faqItem}>
                    <p className={styles.faqAnswer}>{String(result.disclaimer)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
