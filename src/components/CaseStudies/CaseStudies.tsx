import type { CaseCard } from '@/types';
import styles from './CaseStudies.module.css';

const CASES: CaseCard[] = [
  {
    sector: 'Commercial Cleaning',
    name: 'Extreme Cleaning & Maintenance Services',
    body: 'Operating across Victoria with an established client roster including ALDI Stores (78 locations), ECMS came to TenderEngine needing to compete for government and institutional cleaning contracts — without the internal tender writing capability to do it effectively. We built their complete evidence library from their existing documents, then used it to produce a submission-ready response for their first government RFT within days.',
    metrics: [
      { val: '78', label: 'Commercial sites' },
      { val: '3d', label: 'Turnaround' },
      { val: 'Gov', label: 'Sector target' },
    ],
  },
  {
    sector: 'Coffee & Equipment Supply',
    name: 'Arista Coffee',
    body: 'Arista supplies commercial barista equipment to venues ranging from single-group cafes to large-scale institutional operations — with machines offered at no cost to qualifying clients. Their challenge was translating a complex, flexible commercial offering into the structured language government procurement requires. TenderEngine mapped their equipment tiers and service model into a submission that spoke directly to how public sector evaluators score supply contracts.',
    metrics: [
      { val: '4+', label: 'Equipment tiers' },
      { val: '$0', label: 'Machine cost to client' },
      { val: 'B2B', label: 'Model structured' },
    ],
  },
  {
    sector: 'Food & Beverage / Imports',
    name: 'Thirsty Wolf Imports',
    body: "Thirsty Wolf approached TenderEngine to compete for a packaged wine supply contract (PAR25750). Our automated triage identified a critical compliance gap — public liability insurance not yet in place — and flagged it before the draft was written. Instead of submitting a non-compliant tender, the partner had the information needed to resolve it first. The response was held until the requirement was met. That's the system working exactly as intended.",
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
          <span className={styles.tag}>// Client Results</span>
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
