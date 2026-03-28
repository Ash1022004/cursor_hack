"use client";

import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { BookOpen, FileText, Video, Headphones, Download, ExternalLink } from 'lucide-react';
import AssessmentSelector from '@/components/assessments/AssessmentSelector';
import styles from '@/styles/pages/Resources.module.css';

const ResourcesPage: React.FC = () => {
  const [showAssessments, setShowAssessments] = useState(false);
  const resourceCategories = [
    {
      id: 'articles',
      title: 'Articles & Guides',
      description: 'Evidence-based articles and practical guides for mental health',
      icon: FileText,
      color: 'var(--primary-500)',
      resources: [
        {
          title: 'Understanding Anxiety in College Students',
          description: 'A comprehensive guide to recognizing and managing anxiety during your academic journey.',
          type: 'Article',
          readTime: '8 min read',
        },
        {
          title: 'Building Healthy Study Habits',
          description: 'Learn how to create sustainable study routines that support your mental health.',
          type: 'Guide',
          readTime: '12 min read',
        },
        {
          title: 'Managing Academic Stress',
          description: 'Practical strategies for dealing with exam stress and academic pressure.',
          type: 'Article',
          readTime: '6 min read',
        },
      ],
    },
    {
      id: 'videos',
      title: 'Video Content',
      description: 'Educational videos and guided sessions',
      icon: Video,
      color: 'var(--secondary-500)',
      resources: [
        {
          title: 'Introduction to Mindfulness',
          description: 'A beginner-friendly introduction to mindfulness practices for students.',
          type: 'Video',
          readTime: '15 min',
        },
        {
          title: 'Breathing Exercises for Stress Relief',
          description: 'Learn simple breathing techniques to manage stress and anxiety.',
          type: 'Video',
          readTime: '10 min',
        },
        {
          title: 'Building Resilience',
          description: 'Strategies for developing emotional resilience during challenging times.',
          type: 'Video',
          readTime: '20 min',
        },
      ],
    },
    {
      id: 'audio',
      title: 'Audio Resources',
      description: 'Guided meditations and relaxation audio',
      icon: Headphones,
      color: 'var(--accent-teal)',
      resources: [
        {
          title: 'Guided Meditation for Sleep',
          description: 'A calming meditation to help you fall asleep and improve sleep quality.',
          type: 'Audio',
          readTime: '25 min',
        },
        {
          title: 'Morning Mindfulness',
          description: 'Start your day with intention and calm with this morning meditation.',
          type: 'Audio',
          readTime: '10 min',
        },
        {
          title: 'Stress Relief Soundscape',
          description: 'Nature sounds and gentle music to help you relax and unwind.',
          type: 'Audio',
          readTime: '30 min',
        },
      ],
    },
  ];

  const quickLinks = [
    {
      title: 'Crisis Support',
      description: '24/7 mental health crisis resources',
      icon: ExternalLink,
      href: '#',
      urgent: true,
    },
    {
      title: 'Campus Resources',
      description: 'Connect with your university counseling center',
      icon: BookOpen,
      href: '#',
      urgent: false,
    },
    {
      title: 'Self-Assessment Tools',
      description: 'Take a quick mental health assessment',
      icon: FileText,
      href: '#',
      urgent: false,
      onClick: () => setShowAssessments(true),
    },
  ];

  if (showAssessments) {
    return (
      <Layout
        title="Mental Health Assessments - Sehat-Saathi"
        description="Take validated psychological assessments to better understand your mental health."
      >
        <AssessmentSelector />
      </Layout>
    );
  }

  return (
    <Layout
      title="Resources - Sehat-Saathi"
      description="Access a comprehensive library of mental health resources, articles, videos, and tools designed for college students."
    >
      <div className={styles.resources}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Mental Health Resources</h1>
              <p className={styles.heroSubtitle}>
                Access our comprehensive library of evidence-based resources, 
                articles, and tools to support your mental health journey.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className={styles.quickLinks}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Quick Access</h2>
            <div className={styles.quickLinksGrid}>
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <div 
                    key={index} 
                    className={`${styles.quickLinkCard} ${link.urgent ? styles.urgent : ''}`}
                    onClick={link.onClick}
                    style={{ cursor: link.onClick ? 'pointer' : 'default' }}
                  >
                    <div className={styles.quickLinkIcon}>
                      <Icon size={24} />
                    </div>
                    <div className={styles.quickLinkContent}>
                      <h3 className={styles.quickLinkTitle}>{link.title}</h3>
                      <p className={styles.quickLinkDescription}>{link.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Resource Categories */}
        <section className={styles.resourceCategories}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Resource Library</h2>
            <p className={styles.sectionSubtitle}>
              Explore our curated collection of mental health resources
            </p>

            <div className={styles.categoriesGrid}>
              {resourceCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.id} className={styles.categoryCard}>
                    <div className={styles.categoryHeader}>
                      <div className={styles.categoryIcon} style={{ backgroundColor: `${category.color}15` }}>
                        <Icon size={32} style={{ color: category.color }} />
                      </div>
                      <div className={styles.categoryInfo}>
                        <h3 className={styles.categoryTitle}>{category.title}</h3>
                        <p className={styles.categoryDescription}>{category.description}</p>
                      </div>
                    </div>

                    <div className={styles.resourcesList}>
                      {category.resources.map((resource, index) => (
                        <div key={index} className={styles.resourceItem}>
                          <div className={styles.resourceContent}>
                            <h4 className={styles.resourceTitle}>{resource.title}</h4>
                            <p className={styles.resourceDescription}>{resource.description}</p>
                            <div className={styles.resourceMeta}>
                              <span className={styles.resourceType}>{resource.type}</span>
                              <span className={styles.resourceTime}>{resource.readTime}</span>
                            </div>
                          </div>
                          <button className={styles.resourceButton}>
                            {resource.type === 'Audio' ? <Headphones size={16} /> : 
                             resource.type === 'Video' ? <Video size={16} /> : 
                             <FileText size={16} />}
                            {resource.type === 'Audio' ? 'Listen' : 
                             resource.type === 'Video' ? 'Watch' : 'Read'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ResourcesPage;
