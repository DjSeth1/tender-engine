'use client';

import { useState, type FormEvent } from 'react';
import styles from './Contact.module.css';

const SECTORS = [
  'Cleaning & Facilities',
  'Food & Beverage',
  'Coffee & Equipment Supply',
  'Security',
  'Hospitality',
  'Painting & Maintenance',
  'Other',
] as const;

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="contact" className={styles.section}>
      <div className={styles.inner}>
        {/* Left column */}
        <div className={`${styles.left} reveal`}>
          <span className={styles.tag}>// Get In Touch</span>
          <h2>
            Let&apos;s look at<br />your next tender.
          </h2>
          <p className={styles.desc}>
            Send us the RFT and a brief on your business. We&apos;ll run a
            complimentary triage and come back to you with a gap analysis and a
            fixed quote before any work begins.
          </p>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>✉</div>
              <div>
                <div className={styles.detailLabel}>Email</div>
                <div className={styles.detailValue}>
                  <a href="mailto:tenders@watersideai.com.au">
                    tenders@watersideai.com.au
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>🌐</div>
              <div>
                <div className={styles.detailLabel}>Built by</div>
                <div className={styles.detailValue}>
                  <a href="https://watersideai.com.au" target="_blank" rel="noopener noreferrer">
                    Waterside AI
                  </a>{' '}
                  — Melbourne, AU
                </div>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>⏱</div>
              <div>
                <div className={styles.detailLabel}>Response Time</div>
                <div className={styles.detailValue}>
                  Triage report within 48 hours of RFT receipt
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — form */}
        <div className="reveal reveal-delay-1">
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Your Name</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Company</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Acme Pty Ltd"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="jane@company.com.au"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tender Type / Sector</label>
              <select className={styles.select} defaultValue="">
                <option value="" disabled>Select sector...</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tell us about the tender</label>
              <textarea
                className={styles.textarea}
                placeholder="Paste the tender name or reference number, closing date, and any context about your business. If you have the RFT, email it to tenders@watersideai.com.au and mention it here."
              />
            </div>

            <button
              type="submit"
              className={`${styles.submit} ${submitted ? styles.submitSuccess : ''}`}
              disabled={submitted}
            >
              {submitted ? "Sent! We'll be in touch within 48hrs." : 'Submit Enquiry →'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
