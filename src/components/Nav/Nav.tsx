import Link from 'next/link';
import styles from './Nav.module.css';

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        Tender<span>Engine</span>
      </div>
      <ul className={styles.links}>
        <li><Link href="#how">How It Works</Link></li>
        <li><Link href="#cases">Case Studies</Link></li>
        <li><Link href="#pricing">Pricing</Link></li>
        <li>
          <Link href="#contact" className={styles.cta}>
            Get Started
          </Link>
        </li>
      </ul>
    </nav>
  );
}
