import React from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import HealthToolsSection from "@/components/health/HealthToolsSection";
import MotionSection from "@/components/ui/MotionSection";
import {
  Activity,
  Stethoscope,
  Search,
  Calendar,
  Camera,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react";
import contactStyles from "@/styles/pages/Contact.module.css";
import heroExtras from "@/styles/components/health/HealthHub.module.css";

export default function HealthHubPage() {
  return (
    <Layout
      title="Health Tools - Sehat-Saathi"
      description="General health information tools. Not a substitute for professional care."
    >
      <div className={contactStyles.contact}>
        <section className={`${contactStyles.hero} ${heroExtras.healthHero}`}>
          <div className={contactStyles.container}>
            <div className={contactStyles.heroContent}>
              <div className={heroExtras.heroIcons} aria-hidden>
                <Stethoscope size={22} strokeWidth={2} />
                <Activity size={22} strokeWidth={2} />
              </div>
              <h1 className={contactStyles.heroTitle}>Health tools</h1>
              <p className={contactStyles.heroSubtitle}>
                Quick access to symptom guidance, medicine lookup, appointments, and label
                verification.
              </p>
              <div className={heroExtras.heroMetaRow} aria-hidden>
                <span>
                  <Shield size={14} strokeWidth={2} /> General info
                </span>
                <span>
                  <Sparkles size={14} strokeWidth={2} /> Guided steps
                </span>
                <span>
                  <Activity size={14} strokeWidth={2} /> Not a diagnosis
                </span>
              </div>
              <div className={heroExtras.heroQuickRow}>
                <Link href="/symptom-check" className={heroExtras.heroChip}>
                  <Activity size={16} strokeWidth={2} />
                  Symptom check
                  <ChevronRight size={14} strokeWidth={2} />
                </Link>
                <Link href="/medicines" className={heroExtras.heroChip}>
                  <Search size={16} strokeWidth={2} />
                  Medicines
                  <ChevronRight size={14} strokeWidth={2} />
                </Link>
                <Link href="/appointments" className={heroExtras.heroChip}>
                  <Calendar size={16} strokeWidth={2} />
                  Appointments
                  <ChevronRight size={14} strokeWidth={2} />
                </Link>
                <Link href="/verify-medicine" className={heroExtras.heroChip}>
                  <Camera size={16} strokeWidth={2} />
                  Verify label
                  <ChevronRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <HealthToolsSection />

        <MotionSection className={contactStyles.faq}>
          <div className={contactStyles.container}>
            <div className={contactStyles.faqItem}>
              <p className={contactStyles.faqAnswer}>
                This platform provides general medical information and is not a substitute for
                professional medical advice.{" "}
                <Link href="/contact" className={contactStyles.healthBackLink}>
                  Reach out
                </Link>{" "}
                if you need human support.
              </p>
            </div>
          </div>
        </MotionSection>
      </div>
    </Layout>
  );
}
