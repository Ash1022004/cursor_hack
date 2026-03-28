import React from 'react';
import Link from 'next/link';
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import styles from '../../styles/components/layout/Footer.module.css';

const Footer: React.FC = () => {
  const currentYear = 2024; // Static year to avoid hydration issues

  const footerLinks = {
    platform: [
      { name: 'About Us', href: '/about' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Health Tools', href: '/health' },
      { name: 'Resources', href: '/resources' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
    community: [
      { name: 'Blog', href: '/blog' },
      { name: 'Success Stories', href: '/success-stories' },
      { name: 'Research', href: '/research' },
      { name: 'Partners', href: '/partners' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          {/* Brand Section */}
          <div className={styles.brandSection}>
            <div className={styles.logo}>
              <Link href="/" className={styles.logoLink}>
                <Heart className={styles.logoIcon} />
                <span className={styles.logoText}>Sehat-Saathi</span>
              </Link>
            </div>
            <p className={styles.brandDescription}>
              Empowering college students with evidence-based psychological interventions 
              and mental health support through our comprehensive digital platform.
            </p>
            <p className={styles.medicalDisclaimer}>
              This platform provides general medical information and is not a substitute for professional medical advice.
            </p>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <Mail size={16} />
                <span>support@sehatsaathi.com</span>
              </div>
              <div className={styles.contactItem}>
                <Phone size={16} />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className={styles.contactItem}>
                <MapPin size={16} />
                <span>123 University Ave, College Town</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div className={styles.linksSection}>
            <div className={styles.linksGroup}>
              <h3 className={styles.linksTitle}>Platform</h3>
              <ul className={styles.linksList}>
                {footerLinks.platform.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className={styles.link}>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linksGroup}>
              <h3 className={styles.linksTitle}>Support</h3>
              <ul className={styles.linksList}>
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className={styles.link}>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linksGroup}>
              <h3 className={styles.linksTitle}>Community</h3>
              <ul className={styles.linksList}>
                {footerLinks.community.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className={styles.link}>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.footerBottom}>
          <div className={styles.copyright}>
            <p>&copy; {currentYear} Sehat-Saathi. All rights reserved.</p>
          </div>
          <div className={styles.socialLinks}>
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  className={styles.socialLink}
                  aria-label={social.name}
                >
                  <Icon size={20} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
