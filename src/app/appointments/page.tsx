"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Stethoscope,
  Building2,
  Star,
  CheckCircle2,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import MotionButton from "@/components/ui/MotionButton";
import styles from "@/styles/pages/Contact.module.css";
import ap from "@/styles/pages/AppointmentsFlow.module.css";
import motionBtnStyles from "@/styles/components/ui/MotionButton.module.css";
import {
  fetchHospitals,
  type AppointmentHospitalOption,
} from "@/lib/apifyHospitals";
import { INDIAN_STATES_AND_UTS } from "@/lib/indianStates";

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  department?: string;
};

type ApptRow = Record<string, unknown>;

function buildNotesFromSearchParams(sp: ReadonlyURLSearchParams): string {
  const hospital = sp.get("hospital")?.trim();
  const city = sp.get("city")?.trim();
  const doctor = sp.get("doctor")?.trim();
  const specialty = sp.get("specialty")?.trim();
  const context = sp.get("context")?.trim();
  const notesParam = sp.get("notes")?.trim();
  const parts: string[] = [];
  if (hospital) {
    parts.push(
      `From hospital finder: ${hospital}${city ? ` (${city})` : ""}`
    );
  }
  if (doctor || specialty) {
    parts.push(`Interest: ${[doctor, specialty].filter(Boolean).join(" — ")}`);
  }
  if (context) parts.push(context);
  if (notesParam) parts.push(notesParam);
  return parts.join(". ");
}

function AppointmentsPageInner() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const profilePrefillDone = useRef(false);
  const urlNotesApplied = useRef(false);

  const reduce = useReducedMotion();
  const minDate = new Date().toISOString().slice(0, 10);
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
  const [indianState, setIndianState] = useState("");
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [list, setList] = useState<ApptRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  /** Ignore stale responses when the user changes state before a slow Apify run finishes. */
  const hospitalsLoadId = useRef(0);

  async function loadHospitals(stateValue: string) {
    if (!stateValue.trim()) {
      setHospitals([]);
      return;
    }
    const loadId = ++hospitalsLoadId.current;
    setLoadingHospitals(true);
    setDirectoryError(null);
    try {
      const rows = await fetchHospitals(stateValue);
      if (loadId !== hospitalsLoadId.current) return;
      setHospitals(rows);
    } catch {
      if (loadId !== hospitalsLoadId.current) return;
      setHospitals([]);
      setDirectoryError("Failed to load hospitals");
    } finally {
      if (loadId === hospitalsLoadId.current) {
        setLoadingHospitals(false);
      }
    }
  }

  async function loadApifyDoctors(
    hId: string,
    hospitalMeta?: AppointmentHospitalOption
  ) {
    if (!hId) {
      setDoctors([]);
      return;
    }
    setLoadingDoctors(true);
    setError(null);
    try {
      const params = new URLSearchParams({ hospitalId: hId });
      if (hospitalMeta?.name) params.set("hospitalName", hospitalMeta.name);
      if (hospitalMeta?.speciality) params.set("speciality", hospitalMeta.speciality);
      const res = await fetch(`/api/apify/doctors?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { doctors?: Doctor[] };
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
    void refreshList();
  }, []);

  useEffect(() => {
    if (authLoading || profilePrefillDone.current || !user) return;
    if (user.role !== "student") {
      profilePrefillDone.current = true;
      return;
    }
    profilePrefillDone.current = true;
    const full = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    setName((n) => n || full);
    setEmail((e) => e || user.email || "");
    setPhone((p) => p || (user.contactNo != null ? String(user.contactNo) : ""));
  }, [user, authLoading]);

  useEffect(() => {
    if (urlNotesApplied.current) return;
    const built = buildNotesFromSearchParams(searchParams);
    if (!built) return;
    urlNotesApplied.current = true;
    setNotes((prev) => (prev ? prev : built));
  }, [searchParams]);

  useEffect(() => {
    setHospitalId("");
    setDoctorId("");
    setDoctors([]);
    setHospitals([]);
    setDirectoryError(null);
    if (!indianState.trim()) {
      return;
    }
    void loadHospitals(indianState);
  }, [indianState]);

  useEffect(() => {
    setDoctorId("");
    setDoctors([]);
    if (!hospitalId) return;
    const meta = hospitals.find((h) => h.id === hospitalId);
    void loadApifyDoctors(hospitalId, meta);
  }, [hospitalId, hospitals]);

  const selectedHospital = hospitals.find((h) => h.id === hospitalId);
  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  const cantPickHospital = Boolean(
    !indianState.trim() ||
      loadingHospitals ||
      (Boolean(directoryError) && hospitals.length === 0) ||
      (Boolean(indianState.trim()) &&
        !loadingHospitals &&
        hospitals.length === 0 &&
        !directoryError)
  );

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
          indianState,
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
      if (indianState) void loadHospitals(indianState);
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
      <div className={`${styles.contact} ${styles.healthFlow}`}>
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
                  Choose a <strong>state or UT</strong>, then a hospital in that region (India only, via Apify
                  on Convex). Doctors listed are sample slots for that hospital—swap for a real directory
                  later. First hospital load can take up to a minute.
                </p>
                {user?.role === "student" && (
                  <p className={styles.healthMeta} style={{ marginTop: 10 }}>
                    You&apos;re signed in — name, email, and phone can be pre-filled from your profile.
                    Edit anything before you submit.
                  </p>
                )}
              </div>

              {directoryError && (
                <p className={`${styles.faqAnswer} ${styles.healthError}`} role="alert">
                  {directoryError}{" "}
                  <button
                    type="button"
                    className={styles.textLinkButton}
                    onClick={() => indianState && void loadHospitals(indianState)}
                  >
                    Retry
                  </button>
                </p>
              )}

              {indianState.trim() &&
                !loadingHospitals &&
                hospitals.length === 0 &&
                !directoryError && (
                  <p className={styles.faqAnswer} role="status">
                    No hospitals for this state yet—wait and Retry (Apify can take 1–2 minutes). Check Convex
                    logs for <code className={styles.inlineCode}>hospitalsNode</code>. Dataset mode filters by
                    state name in the address.
                  </p>
                )}

              <form onSubmit={onSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="indianState">
                    State / Union territory (India)
                  </label>
                  <div className={ap.inputWithIcon}>
                    <MapPin className={ap.leadingIcon} size={20} strokeWidth={2} aria-hidden />
                    <select
                      id="indianState"
                      className={`${styles.select} ${ap.paddedControl}`}
                      value={indianState}
                      onChange={(e) => setIndianState(e.target.value)}
                      required
                    >
                    <option value="">Select your state</option>
                    {INDIAN_STATES_AND_UTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="name">
                      Full name
                    </label>
                    <div className={ap.inputWithIcon}>
                      <User className={ap.leadingIcon} size={20} strokeWidth={2} aria-hidden />
                      <input
                        id="name"
                        className={`${styles.input} ${ap.paddedControl}`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="email">
                      Email
                    </label>
                    <div className={ap.inputWithIcon}>
                      <Mail className={ap.leadingIcon} size={20} strokeWidth={2} aria-hidden />
                      <input
                        id="email"
                        type="email"
                        className={`${styles.input} ${ap.paddedControl}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="phone">
                      Phone number
                    </label>
                    <div className={ap.inputWithIcon}>
                      <Phone className={ap.leadingIcon} size={20} strokeWidth={2} aria-hidden />
                      <input
                        id="phone"
                        type="tel"
                        className={`${styles.input} ${ap.paddedControl}`}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        autoComplete="tel"
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="preferredDate">
                      Preferred date
                    </label>
                    <div className={`${ap.inputWithIcon} ${ap.dateField}`}>
                      <CalendarDays className={ap.leadingIcon} size={20} strokeWidth={2} aria-hidden />
                      <input
                        id="preferredDate"
                        type="date"
                        min={minDate}
                        className={`${styles.input} ${ap.dateInput}`}
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        required
                      />
                    </div>
                    <p className={styles.healthMeta} style={{ marginTop: 8 }}>
                      Pick a day; add time preferences in notes if you like.
                    </p>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="hospitalId">
                      Hospital
                    </label>
                    <div className={ap.inputWithIcon}>
                      <Building2 className={ap.leadingIcon} size={20} strokeWidth={2} aria-hidden />
                      <select
                        id="hospitalId"
                        className={`${styles.select} ${ap.paddedControl}`}
                        value={hospitalId}
                        onChange={(e) => setHospitalId(e.target.value)}
                        required
                        disabled={cantPickHospital}
                      >
                      <option value="">
                        {!indianState.trim()
                          ? "Select a state first"
                          : loadingHospitals
                            ? "Loading hospitals…"
                            : "Select a hospital"}
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
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="doctorId">
                      Doctor at this hospital
                    </label>
                    <div className={ap.inputWithIcon}>
                      <Stethoscope className={ap.leadingIcon} size={20} strokeWidth={2} aria-hidden />
                      <select
                        id="doctorId"
                        className={`${styles.select} ${ap.paddedControl}`}
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        required
                        disabled={!hospitalId || loadingDoctors || cantPickHospital}
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
                </div>

                {selectedDoctor && (
                  <div className={ap.doctorCard}>
                    <div className={ap.doctorAvatar} aria-hidden>
                      {selectedDoctor.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className={ap.doctorMeta}>
                      <p className={ap.doctorName}>{selectedDoctor.name}</p>
                      <p className={ap.doctorSpec}>{selectedDoctor.specialty}</p>
                      {selectedDoctor.department ? (
                        <p className={ap.doctorSpec}>{selectedDoctor.department}</p>
                      ) : null}
                      <div className={ap.ratingRow}>
                        <Star className={ap.star} size={16} fill="currentColor" aria-hidden />
                        <span>4.8</span>
                        <span style={{ fontWeight: 500, opacity: 0.85 }}>Patient-friendly slot</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="notes">
                    Notes (optional)
                  </label>
                  <div className={`${ap.inputWithIcon} ${ap.textareaWithIcon}`}>
                    <Stethoscope className={ap.leadingIcon} size={20} strokeWidth={2} aria-hidden />
                    <textarea
                      id="notes"
                      className={`${styles.textarea} ${ap.notesArea}`}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Symptoms, time of day, or referral context"
                    />
                  </div>
                </div>

                <MotionButton
                  type="submit"
                  disabled={loading || loadingHospitals || cantPickHospital}
                  className={`${styles.submitButton} ${motionBtnStyles.motionBtn} ${loading ? ap.submitPulse : ""}`}
                >
                  {loading ? <div className={styles.spinner} /> : "Submit request"}
                </MotionButton>
              </form>

              <AnimatePresence mode="wait">
                {message ? (
                  <motion.div
                    key="ok"
                    className={ap.successBanner}
                    role="status"
                    initial={reduce ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
                    animate={
                      reduce
                        ? undefined
                        : { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 24 } }
                    }
                    exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  >
                    <motion.div
                      className={ap.successIcon}
                      initial={reduce ? undefined : { scale: 0 }}
                      animate={reduce ? undefined : { scale: 1, transition: { delay: 0.08, type: "spring", stiffness: 400, damping: 12 } }}
                    >
                      <CheckCircle2 size={36} strokeWidth={2} aria-hidden />
                    </motion.div>
                    <p className={ap.successText}>{message}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
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

function AppointmentsPageFallback() {
  return (
    <Layout
      title="Appointments - Sehat-Saathi"
      description="Request an appointment at a hospital with a specific doctor."
    >
      <div
        className={`${styles.contact} ${styles.healthFlow}`}
        style={{ padding: "48px 16px", textAlign: "center", color: "#6b7280" }}
      >
        Loading…
      </div>
    </Layout>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<AppointmentsPageFallback />}>
      <AppointmentsPageInner />
    </Suspense>
  );
}
