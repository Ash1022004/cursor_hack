import React from 'react';
import Link from 'next/link';
import { Plus, Calendar, MessageCircle, BookOpen, BarChart3 } from 'lucide-react';
import styles from '../../styles/components/dashboard/QuickActions.module.css';

const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Health tools',
      description: 'Symptom check, medicines & more',
      icon: Plus,
      href: '/health',
      color: 'var(--primary-500)',
    },
    {
      title: 'Schedule Session',
      description: 'Plan your next session',
      icon: Calendar,
      href: '/schedule',
      color: 'var(--secondary-500)',
    },
    {
      title: 'Connect with Peers',
      description: 'Join the support community',
      icon: MessageCircle,
      href: '/community',
      color: 'var(--success-500)',
    },
    {
      title: 'Read Resources',
      description: 'Access mental health articles',
      icon: BookOpen,
      href: '/resources',
      color: 'var(--warning-500)',
    },
    {
      title: 'View Progress',
      description: 'Check your detailed analytics',
      icon: BarChart3,
      href: '/progress',
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
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={index} href={action.href} className={styles.actionItem}>
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
