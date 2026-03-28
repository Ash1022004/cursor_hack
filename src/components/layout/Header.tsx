"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Heart,
  User,
  UserPlus,
  Home,
  Info,
  BookOpen,
  MessageCircle,
  LogOut,
  Shield,
  Stethoscope,
  LayoutDashboard,
  UsersRound,
} from 'lucide-react';
import styles from '../../styles/components/layout/Header.module.css';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';

const BASE_NAV = [
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
] as const;

const PEER_SUPPORT_ITEM = {
  name: 'Peer support',
  href: '/dashboard/peer-support',
  icon: UsersRound,
  description: 'Chat with peers — privacy controls in your settings',
} as const;

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [staffMenuOpen, setStaffMenuOpen] = useState(false);
  const staffMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!staffMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (staffMenuRef.current?.contains(e.target as Node)) return;
      setStaffMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStaffMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [staffMenuOpen]);

  useEffect(() => {
    setStaffMenuOpen(false);
  }, [pathname]);

  const navigation = useMemo(() => {
    if (user?.role === 'student') {
      return [BASE_NAV[0], PEER_SUPPORT_ITEM, ...BASE_NAV.slice(1)];
    }
    return [...BASE_NAV];
  }, [user?.role]);

  const isActive = (href: string) => {
    if (href === PEER_SUPPORT_ITEM.href) {
      return (
        pathname === PEER_SUPPORT_ITEM.href ||
        pathname.startsWith(`${PEER_SUPPORT_ITEM.href}/`)
      );
    }
    return pathname === href;
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/" className={styles.logoLink}>
            <Heart className={styles.logoIcon} size={24} strokeWidth={2} />
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
                    aria-label={item.name}
                  >
                    <IconComponent size={20} strokeWidth={2} aria-hidden />
                    <span className={styles.navLinkLabel}>{item.name}</span>
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
                  <Link href="/admin" className={styles.authButton} aria-label="Admin">
                    <Shield size={20} strokeWidth={2} aria-hidden />
                    <span className={styles.authButtonLabel}>Admin</span>
                  </Link>
                  <Link href="/admin/counsellors" className={styles.authButton} aria-label="Counsellors">
                    <Shield size={20} strokeWidth={2} aria-hidden />
                    <span className={styles.authButtonLabel}>Counsellors</span>
                  </Link>
                </>
              )}
              <div className={styles.userMenuWrap}>
                <button
                  type="button"
                  className={styles.authButton}
                  aria-label={user?.firstName ? `Account menu for ${user.firstName}` : "Account menu"}
                  aria-haspopup="menu"
                >
                  <User size={20} strokeWidth={2} aria-hidden />
                  <span className={styles.authButtonLabel}>
                    {user?.firstName || "Account"}
                  </span>
                </button>
                <div
                  className={styles.userMenuPanel}
                  role="menu"
                  aria-label="Account"
                >
                  <Link
                    href="/dashboard"
                    className={styles.userMenuItem}
                    role="menuitem"
                  >
                    <LayoutDashboard size={18} strokeWidth={2} aria-hidden />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    className={styles.userMenuItemDanger}
                    role="menuitem"
                    onClick={logout}
                  >
                    <LogOut size={18} strokeWidth={2} aria-hidden />
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.staffMenuWrap} ref={staffMenuRef}>
                <button
                  type="button"
                  className={styles.authButton}
                  title="Admin or doctor sign-in"
                  aria-label="Staff sign-in menu"
                  aria-expanded={staffMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setStaffMenuOpen((o) => !o)}
                >
                  <Shield size={16} strokeWidth={2} aria-hidden />
                  <span className={styles.authButtonLabel}>Staff</span>
                </button>
                {staffMenuOpen ? (
                  <div className={styles.staffMenuPanel} role="menu" aria-label="Staff sign-in options">
                    <Link
                      href="/login-admin"
                      className={styles.staffMenuItem}
                      role="menuitem"
                      onClick={() => setStaffMenuOpen(false)}
                    >
                      <Shield size={18} strokeWidth={2} aria-hidden />
                      Admin dashboard
                    </Link>
                    <Link
                      href="/login-doctor"
                      className={styles.staffMenuItem}
                      role="menuitem"
                      onClick={() => setStaffMenuOpen(false)}
                    >
                      <Stethoscope size={18} strokeWidth={2} aria-hidden />
                      Doctor / counsellor
                    </Link>
                    <Link
                      href="/staff"
                      className={styles.staffMenuItemSecondary}
                      role="menuitem"
                      onClick={() => setStaffMenuOpen(false)}
                    >
                      Staff portal overview
                    </Link>
                    <Link
                      href="/sign-in"
                      className={styles.staffMenuItemSecondary}
                      role="menuitem"
                      onClick={() => setStaffMenuOpen(false)}
                    >
                      Clerk sign-in
                    </Link>
                  </div>
                ) : null}
              </div>
              <Link
                href="/register"
                className={`${styles.authButton} ${styles.primary}`}
                aria-label="Start my journey"
              >
                <UserPlus size={20} strokeWidth={2} aria-hidden />
                <span className={styles.authButtonLabel}>Start My Journey</span>
              </Link>
            </>
          )}
          </div>

        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={26} strokeWidth={2} /> : <Menu size={26} strokeWidth={2} />}
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
                      <IconComponent size={22} strokeWidth={2} aria-hidden />
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
                        <Shield size={22} strokeWidth={2} aria-hidden />
                        Admin
                      </Link>
                      <Link
                        href="/admin/counsellors"
                        className={styles.mobileAuthButton}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Shield size={22} strokeWidth={2} aria-hidden />
                        Counsellors
                      </Link>
                    </>
                  )}
                  <Link
                    href="/dashboard"
                    className={styles.mobileAuthButton}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard size={22} strokeWidth={2} aria-hidden />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className={`${styles.mobileAuthButton} ${styles.primary}`}
                  >
                    <LogOut size={22} strokeWidth={2} aria-hidden />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login-admin"
                    className={styles.mobileAuthButton}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield size={18} />
                    Admin sign-in
                  </Link>
                  <Link
                    href="/login-doctor"
                    className={styles.mobileAuthButton}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Stethoscope size={18} />
                    Doctor sign-in
                  </Link>
                  <Link
                    href="/staff"
                    className={styles.mobileAuthButton}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield size={22} strokeWidth={2} aria-hidden />
                    Staff portal
                  </Link>
                  <Link
                    href="/register"
                    className={`${styles.mobileAuthButton} ${styles.primary}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus size={22} strokeWidth={2} aria-hidden />
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
