"use client";

import React from "react";
import {
  Shield,
  Users,
  Clock,
  Smartphone,
  Stethoscope,
  Brain,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import MotionSection from "@/components/ui/MotionSection";
import { staggerContainer, fadeUpItem } from "@/animations/variants";
import styles from "../../styles/components/home/Features.module.css";

const Features: React.FC = () => {
  const reduce = useReducedMotion();

  const features = [
    {
      icon: Stethoscope,
      title: "Clinical-Grade Guidance",
      description:
        "Trusted tools for mindfulness, breathing, and stress relief—clear, gentle, and appropriate for every age.",
      color: "var(--primary-600)",
    },
    {
      icon: Shield,
      title: "Your Privacy Matters",
      description:
        "We protect your health journey with strong security. Your information stays confidential.",
      color: "var(--secondary-600)",
    },
    {
      icon: Users,
      title: "Supportive Community",
      description:
        "Connect with others who understand—kids, adults, and elders are all welcome here.",
      color: "var(--primary-500)",
    },
    {
      icon: Brain,
      title: "Celebrate Your Progress",
      description:
        "Track wellbeing over time and notice the small wins that add up to real change.",
      color: "var(--secondary-500)",
    },
    {
      icon: Clock,
      title: "Always Here for You",
      description:
        "Whenever you need reassurance or resources, day or night, support is a tap away.",
      color: "var(--error-500)",
    },
    {
      icon: Smartphone,
      title: "Easy Access, Anywhere",
      description:
        "A calm, readable interface on any device—larger touch targets and clear typography.",
      color: "var(--primary-700)",
    },
  ];

  return (
    <MotionSection id="how-it-helps" className={styles.features}>
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
        >
          <h2 className={styles.title}>How We Support Your Journey</h2>
          <p className={styles.subtitle}>
            Compassionate care that meets you where you are. Every feature is designed for clarity,
            comfort, and trust.
          </p>
        </motion.div>

        <motion.div
          className={styles.grid}
          variants={reduce ? undefined : staggerContainer}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "visible"}
          viewport={{ once: true, margin: "-40px" }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className={styles.featureCard}
                variants={reduce ? undefined : fadeUpItem}
                whileHover={
                  reduce
                    ? undefined
                    : {
                        y: -6,
                        scale: 1.02,
                        transition: { duration: 0.25 },
                      }
                }
              >
                <div
                  className={styles.iconContainer}
                  style={{ backgroundColor: `${feature.color}18` }}
                >
                  <Icon size={32} style={{ color: feature.color }} strokeWidth={2} />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </MotionSection>
  );
};

export default Features;
