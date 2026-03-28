"use client";

import React from 'react';
import Layout from '@/components/layout/Layout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProgressOverview from '@/components/dashboard/ProgressOverview';
import InterventionModules from '@/components/dashboard/InterventionModules';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuickActions from '@/components/dashboard/QuickActions';
import StickyNotesManager from '@/components/ui/StickyNotesManager';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import styles from '@/styles/pages/Dashboard.module.css';

const DashboardPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <Layout
        title="Dashboard - Sehat-Saathi"
        description="Your personal mental health dashboard with progress tracking and intervention modules."
      >
      <div className={styles.dashboard}>
        <DashboardHeader />
        
        <div className={styles.dashboardContent}>
          <div className={styles.mainContent}>
            <ProgressOverview />
            <InterventionModules />
            <RecentActivity />
          </div>
          
          <div className={styles.sidebar}>
            <QuickActions />
          </div>
        </div>
        
        {/* Sticky Notes Manager - appears as floating button */}
        <StickyNotesManager />
      </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
