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
          TenderEngine runs automated workflows to triage, analyse, and draft
          government tender responses — so your team spends 45 minutes per bid
          instead of 45 hours.
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
