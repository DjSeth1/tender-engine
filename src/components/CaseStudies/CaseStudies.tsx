import type { CaseCard } from '@/types';
import styles from './CaseStudies.module.css';

const CASES: CaseCard[] = [
  {
    sector: 'Commercial Cleaning',
    name: 'Extreme Cleaning & Maintenance Services',
    body: 'ECMS had the track record — 78 ALDI stores, years of commercial work across Victoria — but no internal capability to translate it into government procurement language. We built their evidence library from existing documents and delivered their first submission-ready response in three days.',
    metrics: [
      { val: '78', label: 'Commercial sites' },
      { val: '3d', label: 'Turnaround' },
      { val: 'Gov', label: 'Sector target' },
    ],
  },
  {
    sector: 'Coffee & Equipment Supply',
    name: 'Arista Coffee',
    body: "Arista's model doesn't fit neatly into a tender form — flexible equipment tiers, no upfront machine costs, service-led pricing. We structured it all into language government evaluators understand, without losing what makes the offer genuinely strong.",
    metrics: [
      { val: '4+', label: 'Equipment tiers' },
      { val: '$0', label: 'Machine cost to client' },
      { val: 'B2B', label: 'Model structured' },
    ],
  },
  {
    sector: 'Food & Beverage / Imports',
    name: 'Thirsty Wolf Imports',
    body: 'Before we drafted a single word, we flagged a critical gap: public liability insurance wasn\'t in place. The submission would have been non-compliant. We paused, informed the partner, and waited. The response was held until the requirement was met. That\'s the process working exactly as intended.',
    metrics: [
      { val: '1', label: 'Gap flagged early' },
      { val: 'PAR', label: '25750 target' },
      { val: 'F&B', label: 'Sector' },
    ],
  },
];

export default function CaseStudies() {
  return (
    <section id="cases" className={styles.section}>
      <div className={styles.glow} />
      <div className={styles.inner}>
        <div className={`${styles.header} reveal`}>
          <span className={styles.tag}>Client Results</span>
          <h2>
            Real businesses.<br />Real submissions.
          </h2>
        </div>

        <div className={styles.grid}>
          {CASES.map((card, i) => (
            <div
              key={card.name}
              className={`${styles.card} reveal${i > 0 ? ` reveal-delay-${i}` : ''}`}
            >
              <div className={styles.cardSector}>{card.sector}</div>
              <div className={styles.cardName}>{card.name}</div>
              <p className={styles.cardBody}>{card.body}</p>
              <div className={styles.metrics}>
                {card.metrics.map((m) => (
                  <div key={m.label} className={styles.metric}>
                    <div className={styles.metricVal}>{m.val}</div>
                    <div className={styles.metricLabel}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
