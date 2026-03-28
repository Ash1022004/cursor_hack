"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import {
  ArrowRight,
  Play,
  Shield,
  Users,
  Brain,
  Heart,
  Stethoscope,
  Plus,
  Leaf,
} from "lucide-react";
import RotatingAffirmation from "./RotatingAffirmation";
import RippleSurface from "../ui/RippleSurface";
import { useIsMobileMotion } from "@/hooks/useAnimation";
import { staggerContainer, fadeUpItem } from "@/animations/variants";
import styles from "../../styles/components/home/Hero.module.css";

const Hero: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobileMotion();
  const lightMotion = Boolean(reduceMotion || isMobile);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardX = useSpring(mouseX, { stiffness: 28, damping: 26 });
  const cardY = useSpring(mouseY, { stiffness: 28, damping: 26 });

  const onVisualMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (lightMotion) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(px * 16);
      mouseY.set(py * 16);
    },
    [lightMotion, mouseX, mouseY],
  );

  const onVisualLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <section className={styles.hero}>
      {!lightMotion && (
        <div className={styles.heroBlobs} aria-hidden>
          <motion.div
            className={`${styles.heroBlob} ${styles.heroBlob1}`}
            animate={{ x: [0, 28, 0], y: [0, -22, 0] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className={`${styles.heroBlob} ${styles.heroBlob2}`}
            animate={{ x: [0, -20, 0], y: [0, 18, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          />
          <motion.div
            className={`${styles.heroBlob} ${styles.heroBlob3}`}
            animate={{ x: [0, 14, 0], y: [0, 24, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </div>
      )}

      <div className={styles.floatingHealthIcons} aria-hidden>
        <div className={styles.floatingIcon}>
          <Heart size={22} strokeWidth={2} />
        </div>
        <div className={styles.floatingIcon}>
          <Stethoscope size={22} strokeWidth={2} />
        </div>
        <div className={styles.floatingIcon}>
          <Plus size={22} strokeWidth={2} />
        </div>
        <div className={styles.floatingIcon}>
          <Leaf size={22} strokeWidth={2} />
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          <motion.div
            className={styles.textContent}
            variants={reduceMotion ? undefined : staggerContainer}
            initial={reduceMotion ? undefined : "hidden"}
            animate={reduceMotion ? undefined : "visible"}
          >
            <motion.h1
              className={styles.title}
              variants={reduceMotion ? undefined : fadeUpItem}
            >
              Your Safe Space for
              <span className={styles.highlight}> Healing & Growth</span>
            </motion.h1>
            <motion.p
              className={styles.subtitle}
              variants={reduceMotion ? undefined : fadeUpItem}
            >
              A gentle, supportive place where people and families can find peace, build resilience,
              and discover strength at any age. You are not alone—we are here to walk alongside you
              with compassion and care on your health and wellness journey.
            </motion.p>
            <motion.p
              className={styles.heroTagline}
              variants={reduceMotion ? undefined : fadeUpItem}
            >
              For all ages • General health • Mental wellness • Medical guidance
            </motion.p>
            <motion.div variants={reduceMotion ? undefined : fadeUpItem}>
              <RotatingAffirmation />
            </motion.div>
            <motion.div
              className={styles.buttons}
              variants={reduceMotion ? undefined : fadeUpItem}
            >
              <motion.div
                className={styles.ctaMotion}
                whileHover={reduceMotion ? undefined : { scale: 1.05 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              >
                <RippleSurface className={styles.rippleFill} disabled={!!reduceMotion}>
                  <Link
                    href="/register"
                    className={`${styles.primaryButton} ${styles.primaryPulse}`}
                  >
                    Start Feeling Better
                    <ArrowRight size={20} />
                  </Link>
                </RippleSurface>
              </motion.div>
              <motion.div
                className={styles.ctaMotion}
                whileHover={reduceMotion ? undefined : { scale: 1.05 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              >
                <RippleSurface className={styles.rippleFill} disabled={!!reduceMotion}>
                  <button type="button" className={styles.secondaryButton}>
                    <Play size={20} />
                    See How It Helps
                  </button>
                </RippleSurface>
              </motion.div>
            </motion.div>
            <motion.div
              className={styles.trustIndicators}
              variants={reduceMotion ? undefined : fadeUpItem}
            >
              <div className={styles.trustItem}>
                <Shield size={20} />
                <span>Your Privacy Matters</span>
              </div>
              <div className={styles.trustItem}>
                <Users size={20} />
                <span>10,000+ People Supported</span>
              </div>
              <div className={styles.trustItem}>
                <Brain size={20} />
                <span>Gentle, Proven Methods</span>
              </div>
            </motion.div>
          </motion.div>

          <div
            className={styles.visualContent}
            onMouseMove={onVisualMove}
            onMouseLeave={onVisualLeave}
          >
            <motion.div
              className={styles.heroImage}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.backgroundGlow} />
              <div className={styles.organicShape} />

              <div className={styles.natureElements}>
                <motion.div
                  className={styles.floatingLeaf}
                  animate={
                    reduceMotion
                      ? undefined
                      : { y: [0, -8, 0], rotate: [0, 2, 0] }
                  }
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className={styles.floatingLeaf}
                  animate={
                    reduceMotion
                      ? undefined
                      : { y: [0, -10, 0], rotate: [0, -2, 0] }
                  }
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                />
                <motion.div
                  className={styles.floatingLeaf}
                  animate={
                    reduceMotion
                      ? undefined
                      : { y: [0, -6, 0], rotate: [0, 1.5, 0] }
                  }
                  transition={{
                    duration: 5.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />
                <div className={styles.glowOrb} />
                <div className={styles.glowOrb} />
                <div className={styles.waveShape} />
              </div>

              <div className={styles.meditationIllustration}>
                <svg viewBox="0 0 200 200" className={styles.meditationSvg}>
                  <path
                    d="M100 180 L100 120 Q100 100 80 100 Q60 100 60 80 Q60 60 80 60 Q100 60 100 40 Q100 20 120 20 Q140 20 140 40 Q140 60 160 60 Q180 60 180 80 Q180 100 160 100 Q140 100 140 120 L140 180"
                    fill="rgba(16, 185, 129, 0.12)"
                    className={styles.treeSilhouette}
                  />
                  <circle
                    cx="100"
                    cy="160"
                    r="8"
                    fill="rgba(16, 185, 129, 0.18)"
                    className={styles.personHead}
                  />
                  <ellipse
                    cx="100"
                    cy="175"
                    rx="12"
                    ry="8"
                    fill="rgba(16, 185, 129, 0.14)"
                    className={styles.personBody}
                  />
                  <circle
                    cx="100"
                    cy="160"
                    r="25"
                    fill="none"
                    stroke="rgba(16, 185, 129, 0.12)"
                    strokeWidth="1"
                    className={styles.peacefulAura}
                  />
                  <circle
                    cx="100"
                    cy="160"
                    r="35"
                    fill="none"
                    stroke="rgba(14, 165, 233, 0.1)"
                    strokeWidth="1"
                    className={styles.peacefulAura}
                  />
                </svg>
              </div>

              <motion.div
                className={styles.imagePlaceholder}
                style={{ x: cardX, y: cardY }}
              >
                <div className={styles.networkConnections}>
                  <svg className={styles.connectionSvg} viewBox="0 0 400 300">
                    <path
                      d="M80,80 Q200,120 320,100"
                      stroke="rgba(16, 185, 129, 0.2)"
                      strokeWidth="2"
                      fill="none"
                      className={styles.connectionLine1}
                    />
                    <path
                      d="M100,200 Q200,150 300,180"
                      stroke="rgba(14, 165, 233, 0.15)"
                      strokeWidth="1.5"
                      fill="none"
                      className={styles.connectionLine2}
                    />
                    <path
                      d="M120,120 Q200,200 280,140"
                      stroke="rgba(99, 102, 241, 0.14)"
                      strokeWidth="1"
                      fill="none"
                      className={styles.connectionLine3}
                    />
                  </svg>
                </div>

                <motion.div
                  className={`${styles.floatingBubble} ${styles.bubble1}`}
                  animate={
                    reduceMotion ? undefined : { y: [0, -10, 0] }
                  }
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className={styles.bubbleGlow} />
                  <div className={styles.bubbleContent}>
                    <div className={styles.bubbleIcon}>🌱</div>
                    <div className={styles.bubbleText}>
                      <div className={styles.bubbleTitle}>Find Your Calm</div>
                      <div className={styles.bubbleSubtitle}>Gentle breathing exercises</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className={`${styles.floatingBubble} ${styles.bubble2}`}
                  animate={
                    reduceMotion ? undefined : { y: [0, -12, 0] }
                  }
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                  }}
                >
                  <div className={styles.bubbleGlow} />
                  <div className={styles.bubbleContent}>
                    <div className={styles.bubbleIcon}>💚</div>
                    <div className={styles.bubbleText}>
                      <div className={styles.bubbleTitle}>Track Your Growth</div>
                      <div className={styles.bubbleSubtitle}>Celebrate small wins</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className={`${styles.floatingBubble} ${styles.bubble3}`}
                  animate={
                    reduceMotion ? undefined : { y: [0, -8, 0] }
                  }
                  transition={{
                    duration: 5.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.8,
                  }}
                >
                  <div className={styles.bubbleGlow} />
                  <div className={styles.bubbleContent}>
                    <div className={styles.bubbleIcon}>🤗</div>
                    <div className={styles.bubbleText}>
                      <div className={styles.bubbleTitle}>You&apos;re Not Alone</div>
                      <div className={styles.bubbleSubtitle}>Support whenever you need it</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className={styles.sectionEdgeFade} aria-hidden />
    </section>
  );
};

export default Hero;
