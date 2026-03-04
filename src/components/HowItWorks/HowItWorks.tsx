import type { PipeStep } from '@/types';
import styles from './HowItWorks.module.css';

const STATUS_LABEL: Record<PipeStep['status'], string> = {
  auto: 'Automated',
  live: 'Live & Tested',
  partner: 'Partner-Led',
};

const PIPELINE: PipeStep[] = [
  {
    num: '01 — Intake',
    title: 'Tender Received',
    body: 'Forward the RFT to our inbox. Everything else is handled automatically — records created, documents organised, ready to go.',
    status: 'auto',
  },
  {
    num: '02 — Triage',
    title: 'Deep Analysis',
    body: 'We read every line of the RFT. Every requirement mapped, every scoring criterion noted, every gap flagged — before a word is written.',
    status: 'live',
  },
  {
    num: '03 — Gaps',
    title: 'Info Request',
    body: 'Missing something? We produce a clear, prioritised list of what\'s needed — ordered by its impact on your score. No vague asks.',
    status: 'auto',
  },
  {
    num: '04 — Drafting',
    title: 'Full Response Written',
    body: 'Every scored section, written in full. Highest weight first. Built from your client\'s real documents — never invented, never generic.',
    status: 'live',
  },
  {
    num: '05 — Review',
    title: 'Partner Polish',
    body: 'The draft lands in a formatted Google Doc. Your team reviews, refines, applies the expertise only you have. Hours, not days.',
    status: 'partner',
  },
  {
    num: '06 — Submit',
    title: 'Submission Ready',
    body: 'Final package assembled. Attachments, schedules, declarations — all included. Client submits. You hear back on the outcome.',
    status: 'partner',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className={styles.section}>
      <div className={styles.inner}>
        <div className={`${styles.header} reveal`}>
          <div>
            <span className={styles.tag}>How It Works</span>
            <h2>
              From inbox<br />to submission.
            </h2>
          </div>
          <p className={styles.desc}>
            Send us the RFT. We read every line, map it against your evidence,
            flag the gaps, and write the response. You spend a few hours
            reviewing. Your client submits. Most of the work is done before
            you&apos;ve opened the document.
          </p>
        </div>

        <div className={styles.pipeline}>
          {PIPELINE.map((step, i) => (
            <div
              key={step.num}
              className={`${styles.step} reveal${i % 3 !== 0 ? ` reveal-delay-${i % 3}` : ''}`}
            >
              <span className={styles.stepNum}>{step.num}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
              <div className={`${styles.statusBadge} ${styles[`status_${step.status}`]}`}>
                <span className={styles.statusDot} />
                {STATUS_LABEL[step.status]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
