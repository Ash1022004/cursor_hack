"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Search,
  Calendar,
  Camera,
  Wind,
  Heart,
  Brain,
  Shield,
} from "lucide-react";
import MotionSection from "@/components/ui/MotionSection";
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
  },
  {
    href: "/medicines",
    title: "Medicine information",
    description: "Search generic information: uses, dosage, precautions.",
    Icon: Search,
    accent: "search" as const,
  },
  {
    href: "/appointments",
    title: "Appointments",
    description: "Book with a hospital and doctor via your connected appointment API.",
    Icon: Calendar,
    accent: "calendar" as const,
  },
  {
    href: "/verify-medicine",
    title: "Verify medicine label",
    description: "Upload a photo; we run OCR and match to our reference list.",
    Icon: Camera,
    accent: "camera" as const,
  },
];

export default function HealthToolsSection() {
  const reduce = useReducedMotion();

  return (
    <MotionSection className={`${contactStyles.contactInfo} ${styles.patternSection}`}>
      <div className={contactStyles.container}>
        <div className={styles.sectionHeading}>
          <Heart className={styles.headingIcon} size={22} strokeWidth={2} aria-hidden />
          <div>
            <h2 className={styles.sectionTitle}>Tools with you in mind</h2>
            <p className={styles.sectionSubtitle}>
              Clear steps, gentle guidance — built for calm decisions, not rushed ones.
            </p>
          </div>
        </div>

        <div className={styles.trustRow} aria-hidden>
          <Shield size={16} strokeWidth={2} />
          <span>Privacy-aware · General information only</span>
          <Brain size={16} strokeWidth={2} />
        </div>

        <motion.div
          className={contactStyles.contactGrid}
          variants={reduce ? undefined : staggerContainer}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "visible"}
          viewport={{ once: true, margin: "-40px" }}
        >
          {tools.map(({ href, title, description, Icon, accent }) => (
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
                    animate={
                      reduce
                        ? undefined
                        : accent === "pulse"
                          ? { y: [0, -3, 0] }
                          : accent === "search"
                            ? { y: [0, -4, 0], rotate: [0, -4, 4, 0] }
                            : accent === "calendar"
                              ? { rotate: [0, 2, -2, 0] }
                              : { scale: [1, 1.04, 1] }
                    }
                    transition={{
                      duration: accent === "calendar" ? 5 : 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Icon size={32} strokeWidth={2} className={styles.cardLucide} />
                  </motion.span>
                </div>
                <h3 className={contactStyles.contactTitle}>{title}</h3>
                <p className={contactStyles.contactDescription}>{description}</p>
              </Link>
            </motion.div>
          ))}

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
      </div>
    </MotionSection>
  );
}
