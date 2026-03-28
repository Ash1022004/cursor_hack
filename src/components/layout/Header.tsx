"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Heart, User, UserPlus, Home, Info, BookOpen, MessageCircle, LogOut, Shield, Stethoscope } from 'lucide-react';
import styles from '../../styles/components/layout/Header.module.css';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const navigation = [
    { name: 'My Space', href: '/', icon: Home, description: 'Your personal sanctuary' },
    {
      name: 'Saathi',
      href: '/saathi',
      icon: MessageCircle,
      description: 'Saathi • Your Health Companion — talk privately, no account',
    },
    { name: 'Our Story', href: '/about', icon: Info, description: 'Why we care' },
    { name: 'Health Tools', href: '/health', icon: Stethoscope, description: 'Symptoms, medicines & care' },
    { name: 'Guides', href: '/resources', icon: BookOpen, description: 'Help & resources' },
    { name: 'Reach Out', href: '/contact', icon: MessageCircle, description: 'We\'re here for you' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/" className={styles.logoLink}>
            <Heart className={styles.logoIcon} size={22} strokeWidth={2} />
            <span className={styles.logoText}>Sehat-Saathi</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {navigation.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`}
                    title={item.description}
                  >
                    <IconComponent size={15} strokeWidth={2} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.headerActions}>
          <ThemeToggle />
          <div className={styles.authButtons}>
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && (
                <>
                  <Link href="/admin" className={styles.authButton}>
                    <Shield size={18} />
                    Admin
                  </Link>
                  <Link href="/admin/counsellors" className={styles.authButton}>
                    <Shield size={18} />
                    Counsellors
                  </Link>
                </>
              )}
              <Link href="/dashboard" className={styles.authButton}>
                <User size={18} />
                {user?.firstName || 'Profile'}
              </Link>
              <button onClick={logout} className={`${styles.authButton} ${styles.primary}`}>
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className={styles.authButton} title="Counsellor / Admin">
                <Shield size={16} strokeWidth={2} />
                Staff
              </Link>
              <Link href="/register" className={`${styles.authButton} ${styles.primary}`}>
                <UserPlus size={16} strokeWidth={2} />
                Start My Journey
              </Link>
            </>
          )}
          </div>

        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          <nav className={styles.mobileNav}>
            <ul className={styles.mobileNavList}>
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`${styles.mobileNavLink} ${isActive(item.href) ? styles.active : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <IconComponent size={18} />
                      <div>
                        <span>{item.name}</span>
                        <small>{item.description}</small>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className={styles.mobileAuthButtons}>
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' && (
                    <>
                      <Link
                        href="/admin"
                        className={styles.mobileAuthButton}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Shield size={18} />
                        Admin
                      </Link>
                      <Link
                        href="/admin/counsellors"
                        className={styles.mobileAuthButton}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Shield size={18} />
                        Counsellors
                      </Link>
                    </>
                  )}
                  <Link
                    href="/dashboard"
                    className={styles.mobileAuthButton}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={18} />
                    {user?.firstName || 'Profile'}
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }} 
                    className={`${styles.mobileAuthButton} ${styles.primary}`}
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className={styles.mobileAuthButton}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield size={18} />
                    Staff sign-in
                  </Link>
                  <Link
                    href="/register"
                    className={`${styles.mobileAuthButton} ${styles.primary}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus size={18} />
                    Start My Journey
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
