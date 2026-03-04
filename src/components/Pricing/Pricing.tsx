import type { PriceTier } from '@/types';
import styles from './Pricing.module.css';

const TIERS: PriceTier[] = [
  {
    tier: 'Tier 01',
    name: 'Standard',
    range: '$2–2.5k',
    note: 'per submission',
    features: [
      'RFT triage & gap analysis',
      'Up to 5 scored sections drafted',
      'Formatted Google Doc output',
      'Compliance checklist review',
      'One revision round',
    ],
  },
  {
    tier: 'Tier 02 · Most Common',
    name: 'Mid-Complexity',
    range: '$3.5–5k',
    note: 'per submission',
    featured: true,
    features: [
      'Everything in Standard',
      '6–10 scored sections drafted',
      'Section-by-section optimisation',
      'Pricing schedule formatting',
      'Two revision rounds',
      'Partner review coordination',
    ],
  },
  {
    tier: 'Tier 03',
    name: 'Complex',
    range: '$6–8k',
    note: 'per submission',
    features: [
      'Everything in Mid-Complexity',
      'Multi-lot or multi-category RFTs',
      'Full Schedule 10 assembly',
      'Reference management',
      'Unlimited revisions',
      'Submission portal support',
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className={styles.section}>
      <div className={styles.inner}>
        <div className={`${styles.header} reveal`}>
          <span className={styles.tag}>Pricing</span>
          <h2>
            One price. One tender.<br />Here&apos;s the score.
          </h2>
          <p className={styles.headerNote}>
            No retainers. No monthly fees. You pay per tender, priced by
            complexity. Every engagement starts with a complimentary triage —
            you see the gap analysis and the quote before we write a word.
          </p>
        </div>

        <div className={styles.grid}>
          {TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className={`${styles.card} ${tier.featured ? styles.featured : ''} reveal${i > 0 ? ` reveal-delay-${i}` : ''}`}
            >
              <div className={styles.tierLabel}>{tier.tier}</div>
              <div className={styles.tierName}>{tier.name}</div>
              <div className={styles.tierRange}>{tier.range}</div>
              <div className={styles.tierNote}>{tier.note}</div>
              <div className={styles.divider} />
              <ul className={styles.features}>
                {tier.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
