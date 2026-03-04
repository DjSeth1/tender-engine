import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.logo}>
        Tender<span>Engine</span>
      </div>
      <div className={styles.copy}>© 2026 TenderEngine. All rights reserved.</div>
      <div className={styles.by}>
        A{' '}
        <a href="https://watersideai.com.au" target="_blank" rel="noopener noreferrer">
          Waterside AI
        </a>{' '}
        product
      </div>
    </footer>
  );
}
