"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, Pill } from "lucide-react";
import Layout from "@/components/layout/Layout";
import MotionButton from "@/components/ui/MotionButton";
import LayoutStyles from "@/styles/pages/Contact.module.css";
import mp from "@/styles/pages/MedicinesPage.module.css";
import motionBtnStyles from "@/styles/components/ui/MotionButton.module.css";
import { MEDICINE_SUGGESTIONS, medicineTags } from "@/lib/healthUi";
import { staggerContainer, fadeUpItem } from "@/animations/variants";

type Med = {
  name: string;
  genericNames: string[];
  uses: string;
  dosage: string;
  sideEffects: string;
  precautions: string;
};

function tagClass(key: string): string {
  if (key === "safe") return mp.tagSafe;
  if (key === "common") return mp.tagCommon;
  return mp.tagConsult;
}

export default function MedicinesPage() {
  const reduce = useReducedMotion();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Med[]>([]);
  const [fromCache, setFromCache] = useState<boolean | null>(null);
  const [liveSources, setLiveSources] = useState<{ title: string; url: string }[]>([]);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!searchRef.current?.contains(e.target as Node)) setSuggestOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const filteredSuggestions = MEDICINE_SUGGESTIONS.filter(
    (s) => s.toLowerCase().includes(q.trim().toLowerCase()) && q.trim().length > 0
  ).slice(0, 6);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    setFromCache(null);
    setLiveSources([]);
    setSuggestOpen(false);
    try {
      const res = await fetch(`/api/medicines?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults((data.results as Med[]) || []);
      setFromCache(typeof data.fromCache === "boolean" ? data.fromCache : null);
      setLiveSources(
        Array.isArray(data.sources) ? (data.sources as { title: string; url: string }[]) : []
      );
      setInfoMessage(typeof data.message === "string" ? data.message : null);
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
      <div className={`${LayoutStyles.contact} ${LayoutStyles.healthFlow}`}>
        <section className={LayoutStyles.hero}>
          <div className={LayoutStyles.container}>
            <div className={LayoutStyles.heroContent}>
              <h1 className={LayoutStyles.heroTitle}>Medicine information</h1>
              <p className={LayoutStyles.heroSubtitle}>
                <Link href="/health" className={LayoutStyles.healthBackLink}>
                  ← Back to Health tools
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className={LayoutStyles.contactForm}>
          <div className={LayoutStyles.container}>
            <div className={LayoutStyles.formContainer}>
              <form onSubmit={search} className={LayoutStyles.form}>
                <div className={`${LayoutStyles.inputGroup} ${mp.searchGroup}`} ref={searchRef}>
                  <label className={LayoutStyles.label} htmlFor="q">
                    Search by name
                  </label>
                  <div className={mp.searchFieldWrap}>
                    <motion.span
                      className={mp.searchIcon}
                      aria-hidden
                      animate={
                        reduce
                          ? undefined
                          : {
                              scale: [1, 1.12, 1],
                              rotate: [0, -8, 8, 0],
                            }
                      }
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Search size={22} strokeWidth={2} />
                    </motion.span>
                    <input
                      id="q"
                      className={`${LayoutStyles.input} ${mp.searchInput}`}
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value);
                        setSuggestOpen(true);
                      }}
                      onFocus={() => setSuggestOpen(true)}
                      placeholder="e.g. Paracetamol, Ibuprofen"
                      required
                      autoComplete="off"
                    />
                    <AnimatePresence>
                      {suggestOpen && filteredSuggestions.length > 0 && (
                        <motion.div
                          className={mp.suggestPanel}
                          role="listbox"
                          initial={reduce ? undefined : { opacity: 0, y: -6 }}
                          animate={reduce ? undefined : { opacity: 1, y: 0 }}
                          exit={reduce ? undefined : { opacity: 0, y: -4 }}
                          transition={{ duration: 0.2 }}
                        >
                          {filteredSuggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              className={mp.suggestItem}
                              onClick={() => {
                                setQ(s);
                                setSuggestOpen(false);
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <MotionButton
                  type="submit"
                  disabled={loading}
                  className={`${LayoutStyles.submitButton} ${motionBtnStyles.motionBtn} ${loading ? mp.submitPulse : ""}`}
                >
                  {loading ? <div className={LayoutStyles.spinner} /> : "Search"}
                </MotionButton>
              </form>

              {error && (
                <p className={`${LayoutStyles.faqAnswer} ${LayoutStyles.healthError}`}>{error}</p>
              )}

              {fromCache !== null && (
                <p className={`${LayoutStyles.faqAnswer} ${LayoutStyles.healthMeta}`}>
                  {fromCache
                    ? "From curated database (fast lookup)"
                    : "Synthesized from live web sources"}
                </p>
              )}

              {infoMessage && results.length === 0 && (
                <p className={LayoutStyles.faqAnswer}>{infoMessage}</p>
              )}

              {liveSources.length > 0 && (
                <div className={LayoutStyles.faqItem}>
                  <h3 className={LayoutStyles.faqQuestion}>References</h3>
                  <ul className={LayoutStyles.faqAnswer}>
                    {liveSources.map((s) => (
                      <li key={s.url}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={LayoutStyles.healthBackLink}
                        >
                          {s.title || s.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <AnimatePresence mode="wait">
                {results.length > 0 && (
                  <motion.div
                    key={results.map((r) => r.name).join("|")}
                    className={mp.resultGrid}
                    variants={reduce ? undefined : staggerContainer}
                    initial={reduce ? undefined : "hidden"}
                    animate={reduce ? undefined : "visible"}
                  >
                    {results.map((m) => (
                      <motion.article
                        key={m.name}
                        className={mp.medCard}
                        variants={reduce ? undefined : fadeUpItem}
                      >
                        <div className={mp.medCardHead}>
                          <div className={mp.medIcon}>
                            <Pill size={28} strokeWidth={2} aria-hidden />
                          </div>
                          <div>
                            <h3 className={mp.medTitle}>{m.name}</h3>
                            <div className={mp.tagRow}>
                              {medicineTags(m.name).map((t) => (
                                <span key={t.key} className={`${mp.tag} ${tagClass(t.key)}`}>
                                  {t.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className={mp.aliasText}>
                          <strong>Also known as:</strong> {m.genericNames.join(", ")}
                        </p>
                        <div className={mp.sectionBlock}>
                          <p className={mp.sectionLabel}>Uses</p>
                          <p className={mp.sectionText}>{m.uses}</p>
                        </div>
                        <div className={mp.sectionBlock}>
                          <p className={mp.sectionLabel}>Dosage</p>
                          <p className={mp.sectionText}>{m.dosage}</p>
                        </div>
                        <div className={mp.sectionBlock}>
                          <p className={mp.sectionLabel}>Side effects</p>
                          <p className={mp.sectionText}>{m.sideEffects}</p>
                        </div>
                        <div className={mp.sectionBlock}>
                          <p className={mp.sectionLabel}>Precautions</p>
                          <p className={mp.sectionText}>{m.precautions}</p>
                        </div>
                      </motion.article>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {disclaimer && (
                <div className={`${LayoutStyles.faqItem} ${LayoutStyles.healthResultSection}`}>
                  <p className={LayoutStyles.faqAnswer}>{disclaimer}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
