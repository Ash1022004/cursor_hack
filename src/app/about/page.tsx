"use client";

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Heart, Users, Shield, Award, Target, Lightbulb } from 'lucide-react';
import MotionSection from '@/components/ui/MotionSection';
import { fadeUp, staggerContainer, fadeUpItem } from '@/animations/variants';
import styles from '@/styles/pages/About.module.css';

const AboutPage: React.FC = () => {
  const reduce = useReducedMotion();
  const values = [
    {
      icon: Heart,
      title: 'Compassion',
      description: 'We approach mental health with empathy, understanding, and genuine care for every student\'s journey.',
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Your mental health data is protected with the highest standards of security and confidentiality.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'We believe in the power of peer support and building connections among students.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We strive for the highest quality in our interventions and user experience.',
    },
    {
      icon: Target,
      title: 'Evidence-Based',
      description: 'All our interventions are grounded in scientific research and proven methodologies.',
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'We continuously innovate to provide the most effective mental health solutions.',
    },
  ];

  return (
    <Layout
      title="About Us - Sehat-Saathi"
      description="Learn about Sehat-Saathi's mission to provide evidence-based psychological interventions for college students."
    >
      <div className={styles.about}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>About Sehat-Saathi</h1>
              <p className={styles.heroSubtitle}>
                Empowering college students with accessible, evidence-based mental health support 
                through innovative digital interventions.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <MotionSection className={styles.mission}>
          <div className={styles.container}>
            <div className={styles.missionContent}>
              <h2 className={styles.sectionTitle}>Our Mission</h2>
              <p className={styles.missionText}>
                At Sehat-Saathi, we believe that every college student deserves access to high-quality 
                mental health support. Our mission is to break down barriers to mental healthcare by 
                providing evidence-based psychological interventions through an accessible, user-friendly 
                digital platform.
              </p>
              <p className={styles.missionText}>
                We combine cutting-edge technology with proven therapeutic techniques to create a 
                comprehensive mental health ecosystem that supports students throughout their academic 
                journey and beyond.
              </p>
            </div>
          </div>
        </MotionSection>

        {/* Values Section */}
        <section className={styles.values}>
          <div className={styles.container}>
            <motion.div
              className={styles.valuesHeader}
              variants={reduce ? undefined : fadeUp}
              initial={reduce ? undefined : "hidden"}
              whileInView={reduce ? undefined : "visible"}
              viewport={{ once: true, margin: "-60px", amount: 0.2 }}
            >
              <h2 className={styles.sectionTitle}>Our Values</h2>
              <p className={styles.sectionSubtitle}>
                The principles that guide everything we do at Sehat-Saathi
              </p>
            </motion.div>
            <motion.div
              className={styles.valuesGrid}
              variants={reduce ? undefined : staggerContainer}
              initial={reduce ? undefined : "hidden"}
              whileInView={reduce ? undefined : "visible"}
              viewport={{ once: true, margin: "-60px", amount: 0.2 }}
            >
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div key={index} className={styles.valueCard} variants={reduce ? undefined : fadeUpItem}>
                    <div className={styles.valueIcon}>
                      <Icon size={32} />
                    </div>
                    <h3 className={styles.valueTitle}>{value.title}</h3>
                    <p className={styles.valueDescription}>{value.description}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <MotionSection className={styles.stats}>
          <div className={styles.container}>
            <motion.div
              className={styles.statsGrid}
              variants={reduce ? undefined : staggerContainer}
              initial={reduce ? undefined : "hidden"}
              whileInView={reduce ? undefined : "visible"}
              viewport={{ once: true, margin: "-50px", amount: 0.25 }}
            >
              <motion.div className={styles.statItem} variants={reduce ? undefined : fadeUpItem}>
                <div className={styles.statNumber}>10,000+</div>
                <div className={styles.statLabel}>Students Helped</div>
              </motion.div>
              <motion.div className={styles.statItem} variants={reduce ? undefined : fadeUpItem}>
                <div className={styles.statNumber}>50+</div>
                <div className={styles.statLabel}>Universities</div>
              </motion.div>
              <motion.div className={styles.statItem} variants={reduce ? undefined : fadeUpItem}>
                <div className={styles.statNumber}>95%</div>
                <div className={styles.statLabel}>Satisfaction Rate</div>
              </motion.div>
              <motion.div className={styles.statItem} variants={reduce ? undefined : fadeUpItem}>
                <div className={styles.statNumber}>24/7</div>
                <div className={styles.statLabel}>Support Available</div>
              </motion.div>
            </motion.div>
          </div>
        </MotionSection>

        {/* Team Section */}
        <MotionSection className={styles.team}>
          <div className={styles.container}>
            <div className={styles.teamHeader}>
              <h2 className={styles.sectionTitle}>Our Team</h2>
              <p className={styles.sectionSubtitle}>
                Mental health professionals, researchers, and technologists working together
              </p>
            </div>
            <div className={styles.teamContent}>
              <p className={styles.teamText}>
                Our diverse team includes licensed psychologists, clinical researchers, 
                software engineers, and user experience designers. We're united by our 
                commitment to improving mental health outcomes for college students through 
                innovative, evidence-based solutions.
              </p>
              <p className={styles.teamText}>
                Every member of our team brings unique expertise and personal experience 
                with mental health challenges, ensuring that our platform is both 
                scientifically rigorous and deeply empathetic to student needs.
              </p>
            </div>
          </div>
        </MotionSection>
      </div>
    </Layout>
  );
};

export default AboutPage;
