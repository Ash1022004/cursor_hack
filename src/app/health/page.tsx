import React from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import { Search, Calendar, Camera, Activity } from "lucide-react";
import styles from "@/styles/pages/Contact.module.css";

const tools = [
  {
    href: "/symptom-check",
    title: "Symptom check",
    description: "General enquiry based on symptoms, age, and duration.",
    Icon: Activity,
  },
  {
    href: "/medicines",
    title: "Medicine information",
    description: "Search generic information: uses, dosage, precautions.",
    Icon: Search,
  },
  {
    href: "/appointments",
    title: "Appointments",
    description: "Request a basic appointment slot (demo storage).",
    Icon: Calendar,
  },
  {
    href: "/verify-medicine",
    title: "Verify medicine label",
    description: "Upload a photo; we run OCR and match to our reference list.",
    Icon: Camera,
  },
];

export default function HealthHubPage() {
  return (
    <Layout
      title="Health Tools - Sehat-Saathi"
      description="General health information tools. Not a substitute for professional care."
    >
      <div className={styles.contact}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Health tools</h1>
              <p className={styles.heroSubtitle}>
                Quick access to symptom guidance, medicine lookup, appointments, and label verification.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.contactInfo}>
          <div className={styles.container}>
            <div className={styles.contactGrid}>
              {tools.map(({ href, title, description, Icon }) => (
                <Link key={href} href={href} className={`${styles.contactCard} ${styles.contactCardLink}`}>
                  <div className={styles.contactIcon}>
                    <Icon size={32} />
                  </div>
                  <h3 className={styles.contactTitle}>{title}</h3>
                  <p className={styles.contactDescription}>{description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.faq}>
          <div className={styles.container}>
            <div className={styles.faqItem}>
              <p className={styles.faqAnswer}>
                This platform provides general medical information and is not a substitute for professional medical advice.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
