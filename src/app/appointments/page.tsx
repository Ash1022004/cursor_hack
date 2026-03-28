"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import styles from "@/styles/pages/Contact.module.css";
import {
  fetchHospitals,
  type AppointmentHospitalOption,
} from "@/lib/apifyHospitals";

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  department?: string;
};

type ApptRow = Record<string, unknown>;

export default function AppointmentsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<AppointmentHospitalOption[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [list, setList] = useState<ApptRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  async function loadHospitals() {
    setLoadingHospitals(true);
    setDirectoryError(null);
    try {
      const rows = await fetchHospitals();
      setHospitals(rows);
    } catch {
      setHospitals([]);
      setDirectoryError("Failed to load hospitals");
    } finally {
      setLoadingHospitals(false);
    }
  }

  async function loadDoctors(hId: string) {
    if (!hId) {
      setDoctors([]);
      return;
    }
    setLoadingDoctors(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/appointments/doctors?hospitalId=${encodeURIComponent(hId)}`
      );
      const data = (await res.json()) as { doctors?: Doctor[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Could not load doctors");
      }
      setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
    } catch (err) {
      setDoctors([]);
      setError(err instanceof Error ? err.message : "Could not load doctors");
    } finally {
      setLoadingDoctors(false);
    }
  }

  async function refreshList() {
    try {
      const res = await fetch("/api/appointments");
      const data = (await res.json()) as { appointments?: ApptRow[]; error?: string };
      if (!res.ok) {
        setList([]);
        return;
      }
      setList(Array.isArray(data.appointments) ? data.appointments : []);
    } catch {
      setList([]);
    }
  }

  useEffect(() => {
    void loadHospitals();
    void refreshList();
  }, []);

  useEffect(() => {
    setDoctorId("");
    setDoctors([]);
    if (hospitalId) {
      void loadDoctors(hospitalId);
    }
  }, [hospitalId]);

  const selectedHospital = hospitals.find((h) => h.id === hospitalId);
  const selectedDoctor = doctors.find((d) => d.id === doctorId);

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
          phone,
          hospitalId,
          doctorId,
          preferredDate,
          notes: notes || undefined,
          hospitalName: selectedHospital?.name,
          hospitalCity: selectedHospital?.city,
          hospitalAddress: selectedHospital?.address,
          hospitalRating: selectedHospital?.rating,
          hospitalSpeciality: selectedHospital?.speciality,
          doctorName: selectedDoctor?.name,
          doctorSpecialty: selectedDoctor?.specialty,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not book");
      setMessage(
        "Appointment request was sent to the provider. The clinic should contact you to confirm."
      );
      setName("");
      setEmail("");
      setPhone("");
      setHospitalId("");
      setDoctorId("");
      setPreferredDate("");
      setNotes("");
      setDoctors([]);
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout
      title="Appointments - Sehat-Saathi"
      description="Request an appointment at a hospital with a specific doctor."
    >
      <div className={styles.contact}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Book an appointment</h1>
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
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Your details</h2>
                <p className={styles.formSubtitle}>
                  Hospitals come from Apify via Convex (<code className={styles.inlineCode}>APIFY_TOKEN</code>
                  ). The first load can take up to a minute while places are fetched. Optional on Convex:{" "}
                  <code className={styles.inlineCode}>APIFY_HOSPITAL_SEARCH_QUERY</code> (e.g. hospitals in
                  Mumbai). Doctors use your appointment API when configured.
                </p>
              </div>

              {directoryError && (
                <p className={`${styles.faqAnswer} ${styles.healthError}`} role="alert">
                  {directoryError}{" "}
                  <button
                    type="button"
                    className={styles.textLinkButton}
                    onClick={() => void loadHospitals()}
                  >
                    Retry
                  </button>
                </p>
              )}

              {!loadingHospitals && hospitals.length === 0 && !directoryError && (
                <p className={styles.faqAnswer} role="status">
                  No hospitals yet—wait a bit and click Retry (first Apify run can take 1–2 minutes). If it
                  stays empty, check Convex logs for <code className={styles.inlineCode}>hospitalsNode</code>{" "}
                  or set <code className={styles.inlineCode}>APIFY_HOSPITAL_DATASET_ID</code> to a saved
                  Apify dataset. To disable automatic map runs, set{" "}
                  <code className={styles.inlineCode}>APIFY_HOSPITAL_AUTO_RUN_DEFAULTS=false</code> on
                  Convex.
                </p>
              )}

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
                      autoComplete="name"
                      disabled={Boolean(directoryError) && hospitals.length === 0}
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
                      autoComplete="email"
                      disabled={Boolean(directoryError) && hospitals.length === 0}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="phone">
                      Phone number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className={styles.input}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      autoComplete="tel"
                      placeholder="e.g. +91 98765 43210"
                      disabled={Boolean(directoryError) && hospitals.length === 0}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="preferredDate">
                      Preferred date or time
                    </label>
                    <input
                      id="preferredDate"
                      className={styles.input}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      required
                      placeholder="e.g. 2026-04-15 morning"
                      disabled={Boolean(directoryError) && hospitals.length === 0}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="hospitalId">
                      Hospital
                    </label>
                    <select
                      id="hospitalId"
                      className={styles.select}
                      value={hospitalId}
                      onChange={(e) => setHospitalId(e.target.value)}
                      required
                      disabled={loadingHospitals || (Boolean(directoryError) && hospitals.length === 0)}
                    >
                      <option value="">
                        {loadingHospitals ? "Loading hospitals…" : "Select a hospital"}
                      </option>
                      {hospitals.map((h) => (
                        <option
                          key={h.id}
                          value={h.id}
                          title={
                            [
                              h.rating && `Rating: ${h.rating}`,
                              h.speciality && `Speciality: ${h.speciality}`,
                              h.address,
                            ]
                              .filter(Boolean)
                              .join(" · ") || undefined
                          }
                        >
                          {h.name} — {h.city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="doctorId">
                      Doctor at this hospital
                    </label>
                    <select
                      id="doctorId"
                      className={styles.select}
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value)}
                      required
                      disabled={
                        !hospitalId ||
                        loadingDoctors ||
                        (Boolean(directoryError) && hospitals.length === 0)
                      }
                    >
                      <option value="">
                        {!hospitalId
                          ? "First choose a hospital"
                          : loadingDoctors
                            ? "Loading doctors…"
                            : "Select a doctor"}
                      </option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.specialty}
                          {d.department ? ` · ${d.department}` : ""})
                        </option>
                      ))}
                    </select>
                  </div>
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
                    placeholder="Symptoms, referral, or other context"
                    disabled={Boolean(directoryError) && hospitals.length === 0}
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={
                    loading ||
                    loadingHospitals ||
                    (Boolean(directoryError) && hospitals.length === 0)
                  }
                >
                  {loading ? <div className={styles.spinner} /> : "Submit request"}
                </button>
              </form>

              {message && <p className={styles.faqAnswer}>{message}</p>}
              {error && <p className={`${styles.faqAnswer} ${styles.healthError}`}>{error}</p>}

              {list.length > 0 && (
                <div className={`${styles.faqGrid} ${styles.healthResultSection}`}>
                  <h3 className={styles.formTitle}>Recent requests</h3>
                  {list.map((a, idx) => {
                    const id = String(a.id ?? a._id ?? idx);
                    const rowName = String(a.name ?? a.patientName ?? "—");
                    const rowEmail = String(a.email ?? "");
                    const rowPhone = String(a.phone ?? a.phoneNumber ?? "");
                    const hosp =
                      (a.hospitalName as string | undefined) ??
                      (a.hospital as string | undefined);
                    const city = (a.hospitalCity as string | undefined) ?? "";
                    const doc =
                      (a.doctorName as string | undefined) ??
                      (a.doctor as string | undefined);
                    const spec =
                      (a.doctorSpecialty as string | undefined) ??
                      (a.specialty as string | undefined);
                    const when = String(a.preferredDate ?? a.date ?? a.scheduledFor ?? "—");
                    return (
                      <div key={id} className={styles.faqItem}>
                        <p className={styles.faqAnswer}>
                          <strong>{rowName}</strong>
                          {hosp ? (
                            <>
                              {" "}
                              — {hosp}
                              {city ? ` (${city})` : ""}
                              {doc ? (
                                <>
                                  {" "}
                                  — {doc}
                                  {spec ? ` · ${spec}` : ""}
                                </>
                              ) : null}
                            </>
                          ) : null}{" "}
                          — {when}
                        </p>
                        {(rowEmail || rowPhone) && (
                          <p className={styles.faqAnswer}>
                            {rowEmail}
                            {rowPhone ? ` · ${rowPhone}` : ""}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
