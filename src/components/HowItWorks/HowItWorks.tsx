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
    body: 'Partner forwards the RFT to our dedicated inbox. Our workflow detects the attachment, creates a tender record, and uploads all documents to a shared workspace automatically.',
    status: 'auto',
  },
  {
    num: '02 — Triage',
    title: 'Deep Analysis',
    body: "Our automated triage process reads the full RFT, maps every requirement against the client's evidence library, and flags compliance gaps, risks, and scoring opportunities.",
    status: 'live',
  },
  {
    num: '03 — Gaps',
    title: 'Info Request',
    body: 'If anything is missing, we generate a structured shopping list for the partner — prioritised by impact on the tender score. No guessing, no back-and-forth.',
    status: 'auto',
  },
  {
    num: '04 — Drafting',
    title: 'Full Response Written',
    body: 'Once the profile is complete, our drafting workflow writes every scored section — section by section, highest weight first — using real client evidence, never fabricated claims.',
    status: 'live',
  },
  {
    num: '05 — Review',
    title: 'Partner Polish',
    body: "Draft is delivered to the partner as a formatted Google Doc. 2–3 hours of domain expertise review: the part that genuinely requires a human who knows the industry.",
    status: 'partner',
  },
  {
    num: '06 — Submit',
    title: 'Submission Ready',
    body: 'Final package assembled with all required attachments, pricing schedules, and declarations. Submitted via eTendering portal. You get notified of the outcome.',
    status: 'partner',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className={styles.section}>
      <div className={styles.inner}>
        <div className={`${styles.header} reveal`}>
          <div>
            <span className={styles.tag}>// How It Works</span>
            <h2>
              From inbox<br />to submission.
            </h2>
          </div>
          <p className={styles.desc}>
            Partner sends us the RFT. Our automated pipeline reads it,
            cross-references your client&apos;s profile, flags gaps, and drafts
            every scored section. You review. Client submits. The whole process
            is built around minimising every human touchpoint that doesn&apos;t
            require genuine expertise.
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
