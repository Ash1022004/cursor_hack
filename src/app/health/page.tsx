import React from "react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import HealthToolsSection from "@/components/health/HealthToolsSection";
import MotionSection from "@/components/ui/MotionSection";
import contactStyles from "@/styles/pages/Contact.module.css";

export default function HealthHubPage() {
  return (
    <Layout
      title="Health Tools - Sehat-Saathi"
      description="General health information tools. Not a substitute for professional care."
    >
      <div className={`${contactStyles.contact} ${contactStyles.healthFlow}`}>
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
