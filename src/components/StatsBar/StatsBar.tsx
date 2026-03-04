import type { StatItem } from '@/types';
import styles from './StatsBar.module.css';

const STATS: StatItem[] = [
  { num: '45min', label: 'Your time, per bid' },
  { num: '$8k', label: 'Revenue per complex RFT' },
  { num: '10', label: 'Steps in our process' },
  { num: '~$0', label: 'Cost per draft' },
];

export default function StatsBar() {
  return (
    <div className={styles.statsBar}>
      {STATS.map((stat, i) => (
        <div key={stat.label} className={`${styles.statItem} reveal${i > 0 ? ` reveal-delay-${i}` : ''}`}>
          <div className={styles.statNum}>{stat.num}</div>
          <div className={styles.statLabel}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
