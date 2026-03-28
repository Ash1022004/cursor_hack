import React from 'react';
import { Users, Heart, TrendingUp, Award } from 'lucide-react';
import styles from '../../styles/components/home/Stats.module.css';

const Stats: React.FC = () => {
  const stats = [
    {
      icon: Users,
      value: '10,000+',
      label: 'Students Helped',
      description: 'College students across 50+ universities',
    },
    {
      icon: Heart,
      value: '95%',
      label: 'Satisfaction Rate',
      description: 'Students report improved mental health',
    },
    {
      icon: TrendingUp,
      value: '85%',
      label: 'Success Rate',
      description: 'Complete intervention programs',
    },
    {
      icon: Award,
      value: '4.9/5',
      label: 'Platform Rating',
      description: 'Based on user reviews and feedback',
    },
  ];

  return (
    <section className={styles.stats}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Trusted by Students Nationwide</h2>
          <p className={styles.subtitle}>
            Join thousands of college students who have transformed their mental health journey with Sehat-Saathi.
          </p>
        </div>

        <div className={styles.grid}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className={styles.statCard}>
                <div className={styles.iconContainer}>
                  <Icon size={40} />
                </div>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
                <div className={styles.statDescription}>{stat.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;
