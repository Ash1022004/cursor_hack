import React from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Calendar,
  MessageCircle,
  BookOpen,
  Brain,
  UsersRound,
} from 'lucide-react';
import styles from '../../styles/components/dashboard/QuickActions.module.css';

const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Health tools',
      description: 'Symptom check, medicines & more',
      icon: Stethoscope,
      href: '/health',
      color: 'var(--primary-500)',
    },
    {
      title: 'Appointments',
      description: 'Book or manage healthcare visits',
      icon: Calendar,
      href: '/appointments',
      color: 'var(--secondary-500)',
    },
    {
      title: 'Talk to Saathi',
      description: 'Chat with your mental health companion',
      icon: MessageCircle,
      href: '/saathi',
      color: 'var(--success-500)',
    },
    {
      title: 'Peer support',
      description: 'Private peer chat with privacy controls',
      icon: UsersRound,
      href: '/dashboard/peer-support',
      color: 'var(--secondary-600, #7c3aed)',
    },
    {
      title: 'Read resources',
      description: 'Articles, guides & self-assessments',
      icon: BookOpen,
      href: '/resources',
      color: 'var(--warning-500)',
    },
    {
      title: 'Chat memory',
      description: 'Mood trends & conversation highlights',
      icon: Brain,
      href: '/chat/memory',
      color: 'var(--error-500)',
    },
  ];

  return (
    <div className={styles.quickActions}>
      <div className={styles.header}>
        <h2 className={styles.title}>Quick Actions</h2>
        <p className={styles.subtitle}>Jump into your mental health journey</p>
      </div>

      <div className={styles.actionsList}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className={styles.actionItem}>
              <div className={styles.actionIcon} style={{ backgroundColor: `${action.color}15` }}>
                <Icon size={20} style={{ color: action.color }} />
              </div>
              <div className={styles.actionContent}>
                <h3 className={styles.actionTitle}>{action.title}</h3>
                <p className={styles.actionDescription}>{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
