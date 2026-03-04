'use client';

import { useState, useRef, type FormEvent } from 'react';
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

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function Contact() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      company: (form.elements.namedItem('company') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      sector: (form.elements.namedItem('sector') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Something went wrong');
      }

      setStatus('success');
      formRef.current?.reset();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <section id="contact" className={styles.section}>
      <div className={styles.inner}>
        {/* Left column */}
        <div className={`${styles.left} reveal`}>
          <span className={styles.tag}>Get In Touch</span>
          <h2>
            Let&apos;s look at<br />your next tender.
          </h2>
          <p className={styles.desc}>
            Send us the RFT. We&apos;ll review it, run a complimentary triage,
            and come back with a clear gap analysis and a fixed price.
            No obligation. No surprises.
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
          <form
            ref={formRef}
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
          >
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Your Name</label>
                <input
                  name="name"
                  className={styles.input}
                  type="text"
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Company</label>
                <input
                  name="company"
                  className={styles.input}
                  type="text"
                  placeholder="Acme Pty Ltd"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                name="email"
                className={styles.input}
                type="email"
                placeholder="jane@company.com.au"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tender Type / Sector</label>
              <select name="sector" className={styles.select} defaultValue="">
                <option value="" disabled>Select sector...</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tell us about the tender</label>
              <textarea
                name="message"
                className={styles.textarea}
                placeholder="Paste the tender name or reference number, closing date, and any context about your business. If you have the RFT, email it to tenders@watersideai.com.au and mention it here."
              />
            </div>

            {status === 'error' && (
              <p className={styles.errorMsg}>{errorMsg}</p>
            )}

            <button
              type="submit"
              className={`${styles.submit} ${status === 'success' ? styles.submitSuccess : ''}`}
              disabled={status === 'loading' || status === 'success'}
            >
              {status === 'loading' && 'Sending…'}
              {status === 'success' && "Sent! We'll be in touch within 48hrs."}
              {(status === 'idle' || status === 'error') && 'Submit Enquiry →'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
