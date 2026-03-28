import React from 'react';
import Link from 'next/link';
import { Brain, Heart, Users, BookOpen, Play, CheckCircle } from 'lucide-react';
import styles from '../../styles/components/dashboard/InterventionModules.module.css';

const InterventionModules: React.FC = () => {
  const modules = [
    {
      id: 'cbt',
      title: 'Cognitive Behavioral Therapy',
      description: 'Learn to identify and change negative thought patterns',
      icon: Brain,
      progress: 75,
      duration: '6 weeks',
      color: 'var(--primary-500)',
      status: 'in-progress',
    },
    {
      id: 'mindfulness',
      title: 'Mindfulness & Meditation',
      description: 'Develop present-moment awareness and stress reduction',
      icon: Heart,
      progress: 45,
      duration: '4 weeks',
      color: 'var(--secondary-500)',
      status: 'in-progress',
    },
    {
      id: 'social-support',
      title: 'Social Support Network',
      description: 'Build connections and peer support relationships',
      icon: Users,
      progress: 0,
      duration: '8 weeks',
      color: 'var(--success-500)',
      status: 'not-started',
    },
    {
      id: 'stress-management',
      title: 'Stress Management',
      description: 'Techniques for managing academic and personal stress',
      icon: BookOpen,
      progress: 100,
      duration: '3 weeks',
      color: 'var(--warning-500)',
      status: 'completed',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className={styles.completedIcon} />;
      case 'in-progress':
        return <Play size={20} className={styles.inProgressIcon} />;
      default:
        return <Play size={20} className={styles.notStartedIcon} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Start Module';
    }
  };

  return (
    <div className={styles.interventionModules}>
      <div className={styles.header}>
        <h2 className={styles.title}>Intervention Modules</h2>
        <p className={styles.subtitle}>Continue your mental health journey</p>
      </div>

      <div className={styles.grid}>
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <div key={module.id} className={styles.moduleCard}>
              <div className={styles.cardHeader}>
                <div className={styles.iconContainer} style={{ backgroundColor: `${module.color}15` }}>
                  <Icon size={28} style={{ color: module.color }} />
                </div>
                <div className={styles.moduleInfo}>
                  <h3 className={styles.moduleTitle}>{module.title}</h3>
                  <p className={styles.moduleDescription}>{module.description}</p>
                </div>
              </div>

              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressLabel}>Progress</span>
                  <span className={styles.progressValue}>{module.progress}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ 
                      width: `${module.progress}%`,
                      backgroundColor: module.color
                    }}
                  />
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.duration}>
                  <span className={styles.durationText}>{module.duration}</span>
                </div>
                <Link 
                  href="/resources"
                  className={`${styles.actionButton} ${styles[module.status]}`}
                >
                  {getStatusIcon(module.status)}
                  {getStatusText(module.status)}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterventionModules;
