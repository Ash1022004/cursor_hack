"use client";

import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import Stats from '@/components/home/Stats';
import Testimonials from '@/components/home/Testimonials';
import CTA from '@/components/home/CTA';
import PersonalizedDashboard from '@/components/dashboard/PersonalizedDashboard';
import DailyCheckIn from '@/components/ui/DailyCheckIn';
import MoodCheckInWidget from '@/components/home/MoodCheckInWidget';
import RotatingAffirmation from '@/components/home/RotatingAffirmation';

const HomePage: React.FC = () => {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This would come from auth context

  const handleMoodSubmit = (mood: string, note?: string) => {
    console.log('Mood submitted:', mood, note);
    // Here you would save to backend
  };

  return (
    <Layout
      title="Sehat-Saathi - Your Safe Space for Healing & Growth"
      description="A gentle, supportive place where college students can find peace, build resilience, and discover their inner strength. You're not alone in this journey."
    >
      {isLoggedIn ? (
        <PersonalizedDashboard userName="Friend" />
      ) : (
        <>
          <Hero />
          <RotatingAffirmation />
          <MoodCheckInWidget onMoodSelect={(mood) => console.log('Mood selected:', mood)} />
          <Features />
          <RotatingAffirmation />
          <Stats />
          <Testimonials />
          <RotatingAffirmation />
          <CTA />
        </>
      )}
      
      {/* Daily Check-in Widget - can be triggered from anywhere */}
      {showCheckIn && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}>
          <DailyCheckIn 
            onClose={() => setShowCheckIn(false)}
            onMoodSubmit={handleMoodSubmit}
          />
        </div>
      )}
    </Layout>
  );
};

export default HomePage;
