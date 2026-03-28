"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import styles from "@/styles/pages/Contact.module.css";

type Appt = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  preferredDate: string;
  notes?: string;
  createdAt: string;
};

export default function AppointmentsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Appt[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setList((data.appointments as Appt[]) || []);
    } catch {
      setList([]);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          department,
          preferredDate,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not book");
      setMessage("Appointment request saved.");
      setName("");
      setEmail("");
      setPhone("");
      setDepartment("");
      setPreferredDate("");
      setNotes("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Appointments - Sehat-Saathi" description="Book a demo appointment request.">
      <div className={styles.contact}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Appointments</h1>
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
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="name">
                      Full name
                    </label>
                    <input
                      id="name"
                      className={styles.input}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={styles.input}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="phone">
                      Phone (optional)
                    </label>
                    <input
                      id="phone"
                      className={styles.input}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="department">
                      Department / reason
                    </label>
                    <input
                      id="department"
                      className={styles.input}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      placeholder="e.g. General medicine"
                    />
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="preferredDate">
                    Preferred date
                  </label>
                  <input
                    id="preferredDate"
                    className={styles.input}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                    placeholder="e.g. 2026-04-15 or next week morning"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="notes">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    className={styles.textarea}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? <div className={styles.spinner} /> : "Submit request"}
                </button>
              </form>

              {message && <p className={styles.faqAnswer}>{message}</p>}
              {error && <p className={`${styles.faqAnswer} ${styles.healthError}`}>{error}</p>}

              {list.length > 0 && (
                <div className={`${styles.faqGrid} ${styles.healthResultSection}`}>
                  <h3 className={styles.formTitle}>Recent requests</h3>
                  {list.map((a) => (
                    <div key={a.id} className={styles.faqItem}>
                      <p className={styles.faqAnswer}>
                        <strong>{a.name}</strong> — {a.department} — {a.preferredDate}
                      </p>
                      <p className={styles.faqAnswer}>{a.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
