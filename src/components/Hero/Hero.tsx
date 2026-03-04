import Link from 'next/link';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.grid} />
      <div className={styles.inner}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Automated · Australian Government Tenders
        </div>
        <h1 className={styles.heading}>
          Win more tenders.<br />In <em>less time</em>.
        </h1>
        <p className={styles.sub}>
          Most businesses spend 45 hours writing a tender response.
          TenderEngine gets it down to 45 minutes — handling the triage,
          the analysis, and the drafting, so you can focus on what only
          you can do.
        </p>
        <div className={styles.actions}>
          <Link href="#contact" className={styles.btnPrimary}>
            Start Your First Tender
          </Link>
          <Link href="#how" className={styles.btnGhost}>
            See How It Works
          </Link>
        </div>
      </div>
    </section>
  );
}
