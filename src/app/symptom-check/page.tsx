"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Activity, User, Clock, Stethoscope } from "lucide-react";
import Layout from "@/components/layout/Layout";
import HeartbeatDecor from "@/components/health/HeartbeatDecor";
import MotionButton from "@/components/ui/MotionButton";
import contactStyles from "@/styles/pages/Contact.module.css";
import sc from "@/styles/pages/SymptomCheck.module.css";
import { staggerContainer, fadeUpItem } from "@/animations/variants";
import { severityForCondition, type ConditionSeverity } from "@/lib/healthUi";
import motionBtnStyles from "@/styles/components/ui/MotionButton.module.css";

function severityClass(s: ConditionSeverity): string {
  if (s === "high") return sc.severityHigh;
  if (s === "moderate") return sc.severityModerate;
  return sc.severityLow;
}

function severityLabel(s: ConditionSeverity): string {
  if (s === "high") return "Seek care";
  if (s === "moderate") return "Monitor";
  return "General";
}

export default function SymptomCheckPage() {
  const reduce = useReducedMotion();
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [duration, setDuration] = useState("");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adviceStr = result ? String(result.advice ?? "") : "";

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
      <div className={`${contactStyles.contact} ${contactStyles.healthFlow}`}>
        <section className={contactStyles.hero}>
          <div className={contactStyles.container}>
            <div className={contactStyles.heroContent}>
              <h1 className={contactStyles.heroTitle}>Symptom check</h1>
              <p className={contactStyles.heroSubtitle}>
                <Link href="/health" className={contactStyles.healthBackLink}>
                  ← Back to Health tools
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className={contactStyles.contactForm}>
          <div className={contactStyles.container}>
            <div className={contactStyles.formContainer}>
              <div className={sc.assistantWrap}>
                <div className={sc.stepRail} aria-hidden>
                  {["Describe", "You", "Timeline"].map((label, i) => (
                    <React.Fragment key={label}>
                      <div className={sc.stepDot}>
                        <span
                          className={`${sc.stepNum} ${step >= i ? sc.stepNumActive : ""} ${step > i ? sc.stepNumDone : ""}`}
                        >
                          {i + 1}
                        </span>
                        <span className={sc.stepLabel}>{label}</span>
                      </div>
                      {i < 2 ? <div className={sc.stepConnector} /> : null}
                    </React.Fragment>
                  ))}
                </div>

                <form onSubmit={onSubmit} className={contactStyles.form}>
                  <div className={sc.cardsStack}>
                    <motion.div
                      className={sc.formCard}
                      onFocus={() => setStep(0)}
                      initial={reduce ? undefined : { opacity: 0, y: 14 }}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className={sc.cardHead}>
                        <div className={sc.cardHeadIcon}>
                          <Activity size={22} strokeWidth={2} aria-hidden />
                        </div>
                        <div className={sc.cardHeadText}>
                          <h2 className={sc.cardTitle}>What are you experiencing?</h2>
                          <p className={sc.cardHint}>
                            A few plain words help — you can refine with age and duration in the next
                            cards.
                          </p>
                        </div>
                      </div>
                      <div className={`${sc.fieldControl} ${contactStyles.inputGroup}`}>
                        <label className={`${contactStyles.label} ${sc.fieldLabel}`} htmlFor="symptoms">
                          <Activity size={16} aria-hidden />
                          Symptoms
                        </label>
                        <textarea
                          id="symptoms"
                          className={`${contactStyles.textarea} ${sc.fieldInner}`}
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          onFocus={() => setStep(0)}
                          required
                          placeholder="Describe your symptoms (e.g. fever, sore throat)"
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      className={sc.formCard}
                      onFocus={() => setStep(1)}
                      initial={reduce ? undefined : { opacity: 0, y: 14 }}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className={sc.cardHead}>
                        <div className={sc.cardHeadIcon}>
                          <User size={22} strokeWidth={2} aria-hidden />
                        </div>
                        <div className={sc.cardHeadText}>
                          <h2 className={sc.cardTitle}>About you</h2>
                          <p className={sc.cardHint}>
                            Age and gender add context for general, non-diagnostic guidance only.
                          </p>
                        </div>
                      </div>
                      <div className={contactStyles.formRow}>
                        <div className={`${sc.fieldControl} ${contactStyles.inputGroup}`}>
                          <label className={`${contactStyles.label} ${sc.fieldLabel}`} htmlFor="age">
                            <User size={16} aria-hidden />
                            Age
                          </label>
                          <input
                            id="age"
                            type="number"
                            min={0}
                            max={120}
                            className={`${contactStyles.input} ${sc.fieldInner}`}
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            onFocus={() => setStep(1)}
                            required
                          />
                        </div>
                        <div className={`${sc.fieldControl} ${contactStyles.inputGroup}`}>
                          <label className={`${contactStyles.label} ${sc.fieldLabel}`} htmlFor="gender">
                            Gender
                          </label>
                          <input
                            id="gender"
                            className={`${contactStyles.input} ${sc.fieldInner}`}
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            onFocus={() => setStep(1)}
                            required
                            placeholder="As you identify / clinical context"
                          />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className={sc.formCard}
                      onFocus={() => setStep(2)}
                      initial={reduce ? undefined : { opacity: 0, y: 14 }}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className={sc.cardHead}>
                        <div className={sc.cardHeadIcon}>
                          <Clock size={22} strokeWidth={2} aria-hidden />
                        </div>
                        <div className={sc.cardHeadText}>
                          <h2 className={sc.cardTitle}>How long has this been going on?</h2>
                          <p className={sc.cardHint}>Rough duration is enough (e.g. 3 days).</p>
                        </div>
                      </div>
                      <div className={`${sc.fieldControl} ${contactStyles.inputGroup}`}>
                        <label className={`${contactStyles.label} ${sc.fieldLabel}`} htmlFor="duration">
                          <Clock size={16} aria-hidden />
                          Duration
                        </label>
                        <input
                          id="duration"
                          className={`${contactStyles.input} ${sc.fieldInner}`}
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          onFocus={() => setStep(2)}
                          required
                          placeholder="e.g. 3 days"
                        />
                      </div>
                    </motion.div>
                  </div>

                  <div className={`${sc.actions} ${sc.submitRow}`}>
                    <MotionButton
                      type="submit"
                      disabled={loading}
                      className={`${contactStyles.submitButton} ${motionBtnStyles.motionBtn} ${loading ? sc.loadingPulse : ""}`}
                    >
                      {loading ? <div className={contactStyles.spinner} /> : "Check guidance"}
                    </MotionButton>
                  </div>
                </form>

                {error && <p className={`${contactStyles.faqAnswer} ${contactStyles.healthError}`}>{error}</p>}

                <AnimatePresence mode="wait">
                  {result && (
                    <motion.div
                      key="results"
                      className={sc.resultsSection}
                      initial={reduce ? undefined : { opacity: 0, y: 20 }}
                      animate={reduce ? undefined : { opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -12 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className={sc.resultsHead}>
                        <div className={sc.cardHeadIcon}>
                          <Stethoscope size={22} strokeWidth={2} aria-hidden />
                        </div>
                        <h3 className={sc.resultsTitle}>Possible directions to discuss</h3>
                        <HeartbeatDecor />
                      </div>

                      <motion.div
                        className={sc.conditionGrid}
                        variants={reduce ? undefined : staggerContainer}
                        initial={reduce ? undefined : "hidden"}
                        animate={reduce ? undefined : "visible"}
                      >
                        {(result.possible_conditions as string[])?.map((c, idx) => {
                          const sev = severityForCondition(c, adviceStr, idx);
                          return (
                            <motion.div
                              key={c}
                              className={sc.conditionCard}
                              variants={reduce ? undefined : fadeUpItem}
                            >
                              <div className={sc.conditionTop}>
                                <p className={sc.conditionName}>{c}</p>
                                <span className={`${sc.severity} ${severityClass(sev)}`}>
                                  {severityLabel(sev)}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>

                      <div className={sc.blockCard}>
                        <h4 className={sc.blockTitle}>Suggested medicines (generic)</h4>
                        {(result.suggested_medicines as { generic: string; note: string }[])?.map((m) => (
                          <p key={m.generic} className={sc.blockBody}>
                            <strong>{m.generic}</strong> — {m.note}
                          </p>
                        ))}
                      </div>

                      <div className={sc.blockCard}>
                        <h4 className={sc.blockTitle}>Advice</h4>
                        <p className={sc.blockBody}>{String(result.advice)}</p>
                      </div>

                      {Array.isArray(result.sources) && result.sources.length > 0 && (
                        <div className={sc.blockCard}>
                          <h4 className={sc.blockTitle}>Sources (retrieved)</h4>
                          <ul className={sc.list}>
                            {(result.sources as { title?: string; url?: string }[]).map((sItem) => (
                              <li key={sItem.url}>
                                <a
                                  href={sItem.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={contactStyles.healthBackLink}
                                >
                                  {sItem.title || sItem.url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className={sc.blockCard}>
                        <p className={sc.blockBody}>
                          <span className={contactStyles.healthMeta}>
                            Source mode: {String(result.source ?? "unknown")}
                          </span>
                        </p>
                        <p className={sc.blockBody}>{String(result.disclaimer)}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
