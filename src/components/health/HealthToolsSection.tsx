"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Pill,
  CalendarCheck,
  Camera,
  Wind,
  Heart,
  Brain,
  Shield,
  Stethoscope,
} from "lucide-react";
import { staggerContainer, fadeUpItem } from "@/animations/variants";
import BreathingPreview from "@/components/health/BreathingPreview";
import contactStyles from "@/styles/pages/Contact.module.css";
import styles from "@/styles/components/health/HealthHub.module.css";

const tools = [
  {
    href: "/symptom-check",
    title: "Symptom check",
    description: "General enquiry based on symptoms, age, and duration.",
    Icon: Activity,
    accent: "pulse" as const,
    iconMotion: "heartbeat" as const,
  },
  {
    href: "/medicines",
    title: "Medicine information",
    description: "Search generic information: uses, dosage, precautions.",
    Icon: Pill,
    accent: "capsule" as const,
    iconMotion: "capsule" as const,
  },
  {
    href: "/appointments",
    title: "Appointments",
    description: "Book with a hospital and doctor via your connected appointment API.",
    Icon: CalendarCheck,
    accent: "calendar" as const,
    iconMotion: "calendarTick" as const,
  },
  {
    href: "/verify-medicine",
    title: "Verify medicine label",
    description: "Upload a photo; we run OCR and match to our reference list.",
    Icon: Camera,
    accent: "camera" as const,
    iconMotion: "camera" as const,
  },
];

function iconAnimate(
  key: (typeof tools)[number]["iconMotion"],
  reduce: boolean
): { animate?: object; transition?: object } {
  if (reduce) return {};
  switch (key) {
    case "heartbeat":
      return {
        animate: { scale: [1, 1.14, 1.04, 1.12, 1] },
        transition: { duration: 1.15, repeat: Infinity, ease: "easeInOut" as const },
      };
    case "capsule":
      return {
        animate: { y: [0, -6, 0], rotate: [0, -4, 4, 0] },
        transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const },
      };
    case "calendarTick":
      return {
        animate: { rotate: [0, -4, 4, 0], scale: [1, 1.06, 1, 1.04, 1] },
        transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" as const },
      };
    case "camera":
    default:
      return {
        animate: { scale: [1, 1.05, 1] },
        transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const },
      };
  }
}

export default function HealthToolsSection() {
  const reduce = useReducedMotion();

  return (
    <section className={`${contactStyles.contactInfo} ${styles.patternSection}`}>
      <motion.div
        className={contactStyles.container}
        variants={reduce ? undefined : staggerContainer}
        initial={reduce ? undefined : "hidden"}
        whileInView={reduce ? undefined : "visible"}
        viewport={{ once: true, margin: "-48px", amount: 0.15 }}
      >
        <motion.div className={styles.sectionHeading} variants={reduce ? undefined : fadeUpItem}>
          <Heart className={styles.headingIcon} size={22} strokeWidth={2} aria-hidden />
          <div>
            <h2 className={styles.sectionTitle}>Tools with you in mind</h2>
            <p className={styles.sectionSubtitle}>
              Clear steps, gentle guidance — built for calm decisions, not rushed ones.
            </p>
          </div>
        </motion.div>

        <motion.div className={styles.trustRow} aria-hidden variants={reduce ? undefined : fadeUpItem}>
          <Shield size={16} strokeWidth={2} />
          <Stethoscope size={16} strokeWidth={2} />
          <span>Privacy-aware · General information only</span>
          <Brain size={16} strokeWidth={2} />
        </motion.div>

        <motion.div className={contactStyles.contactGrid} variants={reduce ? undefined : staggerContainer}>
          {tools.map(({ href, title, description, Icon, accent, iconMotion }) => {
            const ia = iconAnimate(iconMotion, Boolean(reduce));
            return (
              <motion.div key={href} variants={reduce ? undefined : fadeUpItem}>
                <Link
                  href={href}
                  className={`${contactStyles.contactCard} ${contactStyles.contactCardLink} ${styles.healthCard}`}
                >
                  <div className={`${styles.cardArt} ${styles[`accent_${accent}`]}`} aria-hidden>
                    <svg className={styles.ecgLine} viewBox="0 0 120 32" preserveAspectRatio="none">
                      <path
                        d="M0 16 L12 16 L16 8 L22 24 L28 10 L34 22 L40 16 L120 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className={`${contactStyles.contactIcon} ${styles.iconShell}`}>
                    <motion.span
                      className={styles.floatingIcon}
                      animate={"animate" in ia ? ia.animate : undefined}
                      transition={"transition" in ia ? ia.transition : undefined}
                    >
                      <Icon size={32} strokeWidth={2} className={styles.cardLucide} />
                    </motion.span>
                  </div>
                  <h3 className={contactStyles.contactTitle}>{title}</h3>
                  <p className={contactStyles.contactDescription}>{description}</p>
                </Link>
              </motion.div>
            );
          })}

          <motion.div variants={reduce ? undefined : fadeUpItem}>
            <Link
              href="/#relax"
              className={`${contactStyles.contactCard} ${contactStyles.contactCardLink} ${styles.healthCard} ${styles.relaxCard}`}
            >
              <div className={`${styles.cardArt} ${styles.accent_relax}`} aria-hidden>
                <svg className={styles.ecgLine} viewBox="0 0 120 32" preserveAspectRatio="none">
                  <path
                    d="M0 16 L20 16 L26 6 L32 26 L38 12 L44 20 L50 16 L120 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className={`${contactStyles.contactIcon} ${styles.iconShell} ${styles.relaxIconWrap}`}>
                <BreathingPreview />
                <Wind className={styles.relaxWind} size={28} strokeWidth={2} aria-hidden />
              </div>
              <h3 className={contactStyles.contactTitle}>Relax &amp; Reset</h3>
              <p className={contactStyles.contactDescription}>
                A short breathing rhythm on the home page — tap to open when you need to steady your
                nervous system.
              </p>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
