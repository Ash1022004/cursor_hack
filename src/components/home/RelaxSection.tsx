"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import BreathingExercise from "@/components/games/BreathingExercise";
import styles from "@/styles/components/home/RelaxSection.module.css";

const RelaxSection: React.FC = () => {
  const reduce = useReducedMotion();

  return (
    <section id="relax" className={styles.section} aria-labelledby="relax-heading">
      <div className={styles.inner}>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={styles.header}
        >
          <h2 id="relax-heading" className={styles.title}>
            Take a Moment to Relax
          </h2>
          <p className={styles.subtitle}>
            A short breathing rhythm can steady your nervous system. Stay as long as feels right.
          </p>
        </motion.div>
        <BreathingExercise />
      </div>
    </section>
  );
};

export default RelaxSection;
