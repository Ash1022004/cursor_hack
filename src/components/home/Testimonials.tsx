import React from 'react';
import { Star, Quote } from 'lucide-react';
import styles from '../../styles/components/home/Testimonials.module.css';

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      name: 'Sarah Chen',
      university: 'Stanford University',
      program: 'Computer Science',
      rating: 5,
      text: 'Sehat-Saathi helped me manage my anxiety during finals week. The mindfulness exercises and CBT techniques were incredibly effective. I feel more confident and in control of my mental health.',
      avatar: 'SC',
    },
    {
      name: 'Michael Rodriguez',
      university: 'UCLA',
      program: 'Psychology',
      rating: 5,
      text: 'As a psychology student, I was skeptical about digital interventions. But Sehat-Saathi exceeded my expectations. The evidence-based approach and personalized tracking made a real difference in my stress levels.',
      avatar: 'MR',
    },
    {
      name: 'Emily Johnson',
      university: 'Harvard University',
      program: 'Pre-Med',
      rating: 5,
      text: 'The peer support community on Sehat-Saathi has been invaluable. Connecting with other pre-med students who understand the pressure has helped me feel less alone in my journey.',
      avatar: 'EJ',
    },
    {
      name: 'David Kim',
      university: 'MIT',
      program: 'Engineering',
      rating: 5,
      text: 'The progress tracking feature helped me see real improvements in my mood and stress levels over time. The data-driven approach gave me confidence that the interventions were working.',
      avatar: 'DK',
    },
  ];

  return (
    <section className={styles.testimonials}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>What Students Are Saying</h2>
          <p className={styles.subtitle}>
            Real stories from college students who have transformed their mental health with Sehat-Saathi.
          </p>
        </div>

        <div className={styles.grid}>
          {testimonials.map((testimonial, index) => (
            <div key={index} className={styles.testimonialCard}>
              <div className={styles.quoteIcon}>
                <Quote size={24} />
              </div>
              <div className={styles.rating}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className={styles.star} />
                ))}
              </div>
              <p className={styles.testimonialText}>{testimonial.text}</p>
              <div className={styles.author}>
                <div className={styles.avatar}>
                  {testimonial.avatar}
                </div>
                <div className={styles.authorInfo}>
                  <div className={styles.authorName}>{testimonial.name}</div>
                  <div className={styles.authorDetails}>
                    {testimonial.program} • {testimonial.university}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
