"use client";

import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import styles from '@/styles/pages/Contact.module.css';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Handle form submission here
    }, 2000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      details: 'support@sehatsaathi.com',
      description: 'We\'ll respond within 24 hours',
    },
    {
      icon: Phone,
      title: 'Call Us',
      details: '+1 (555) 123-4567',
      description: 'Mon-Fri 9AM-6PM EST',
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      details: '123 University Ave',
      description: 'College Town, CA 90210',
    },
  ];

  return (
    <Layout
      title="Contact Us - Sehat-Saathi"
      description="Get in touch with the Sehat-Saathi team for support, questions, or feedback."
    >
      <div className={styles.contact}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>Get in Touch</h1>
              <p className={styles.heroSubtitle}>
                We're here to help. Reach out to us for support, questions, or feedback.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className={styles.contactInfo}>
          <div className={styles.container}>
            <div className={styles.contactGrid}>
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <div key={index} className={styles.contactCard}>
                    <div className={styles.contactIcon}>
                      <Icon size={32} />
                    </div>
                    <h3 className={styles.contactTitle}>{info.title}</h3>
                    <p className={styles.contactDetails}>{info.details}</p>
                    <p className={styles.contactDescription}>{info.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className={styles.contactForm}>
          <div className={styles.container}>
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>Send us a Message</h2>
                <p className={styles.formSubtitle}>
                  Have a question or need support? We'd love to hear from you.
                </p>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="name" className={styles.label}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="email" className={styles.label}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="subject" className={styles.label}>
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="What's this about?"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="message" className={styles.label}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className={styles.textarea}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitButton}
                >
                  {isSubmitting ? (
                    <div className={styles.spinner} />
                  ) : (
                    <>
                      <Send size={20} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={styles.faq}>
          <div className={styles.container}>
            <div className={styles.faqHeader}>
              <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
              <p className={styles.faqSubtitle}>
                Quick answers to common questions
              </p>
            </div>
            <div className={styles.faqGrid}>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Is Sehat-Saathi free to use?</h3>
                <p className={styles.faqAnswer}>
                  Yes! Sehat-Saathi offers free access to basic interventions and resources. 
                  Premium features are available for enhanced support.
                </p>
              </div>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Is my data secure?</h3>
                <p className={styles.faqAnswer}>
                  Absolutely. We use enterprise-grade security and are HIPAA compliant. 
                  Your mental health data is encrypted and protected.
                </p>
              </div>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>Can I use this alongside therapy?</h3>
                <p className={styles.faqAnswer}>
                  Yes! Sehat-Saathi is designed to complement traditional therapy, not replace it. 
                  Many students use both for comprehensive support.
                </p>
              </div>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>How do I get started?</h3>
                <p className={styles.faqAnswer}>
                  Simply create a free account, complete the initial assessment, and start 
                  with our recommended intervention modules.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ContactPage;
