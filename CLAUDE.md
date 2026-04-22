# TenderEngine — Agent Instructions

## What This Is
An agentic tender response system. Four agents — onboarding, triage, drafting, and polish — work together to analyse government and commercial tenders, assess client readiness, and produce draft response documents.

## Architecture
- **Notion** — Tracks tenders, clients, and status via MCP
- **Google Drive** — Stores tender documents and agent output files via MCP
- **Claude Code** — Runs the agents

## Databases
- **TenderEngine — Tenders**: One row per tender. Tracks status, deadline, sections found/drafted, gaps, compliance flags, output doc links.
- **TenderEngine — Clients**: One row per client. Stores company details, contacts, insurance, references, sector info.

## Agents

### Onboarding Agent (`agents/onboarding-agent.md`)
**Run once per new client, before any triage work.**
Scans the client's Drive folder and Notion profile. Reads every document, assesses quality and currency, maps against standard tender requirements, produces a readiness score and a client-ready shopping list of what's missing. Updates the client's Profile Status in Notion.

### Triage Agent (`agents/triage-agent.md`)
**Run first on every new tender.**
Reads the tender docs, detects submission format, maps all sections, assesses client readiness, identifies gaps, and writes the triage report to Notion.
Key output: RESPONSE_FORMAT, SUBMISSION_FILES, TEMPLATE_STRUCTURE — these tell the drafting agent exactly what files to create and how to structure them.

### Drafting Agent (`agents/drafting-agent.md`)
**Run after triage is complete.**
Reads the triage output, reads the tender docs, reads the client profile, and produces draft response files in Google Drive. Creates one Google file per submission deliverable plus a submission checklist.
Supports re-runs: when new client info comes in, re-run and it fills in the gaps without rewriting existing content.

### Polish Agent (`agents/polish-agent.md`)
**Run after drafting is complete.**
Reads the draft response and surgically removes AI writing patterns. Does not rewrite — it finds specific tells (em-dash overuse, mirror-back openings, comfort words, uniform sentence length, filler transitions, hedging, empty closings) and fixes them. One pass only. Substance and facts are never changed.

### Debrief Agent (`agents/debrief-agent.md`)
**Run after a result has been received.**
Captures the outcome (Won / Lost / No Award / Unsuccessful / Withdrawn), processes any evaluator feedback, and feeds learnings back into the system. Enriches the client profile with new evidence surfaced during the bid, records sector intelligence about this buyer and procurement type, and flags follow-up actions the partner needs to take before the next bid.

## Workflow

### New Client
1. Create a client record in Notion with company name, ABN, contact details, sectors
2. Create their Drive folder under TenderEngine/Clients/[Name]/ with standard subfolders
3. Upload any documents the partner has provided
4. Run onboarding: `Read CLAUDE.md and agents/onboarding-agent.md. Run onboarding audit for [Notion client page URL].`
5. Review the shopping list. Send to partner/client to fill gaps.
6. When new docs arrive, upload to Drive and re-run onboarding to reassess readiness.

### New Tender
1. Upload tender docs to a folder in Google Drive under TenderEngine/Tenders/
2. Create a tender record in Notion with deadline, client link, and Drive folder link
3. Run triage: `Read CLAUDE.md and agents/triage-agent.md. Run triage on [Notion tender page URL].`
4. Review triage output. Send client action list to the client.
5. Run drafting: `Read CLAUDE.md and agents/drafting-agent.md. Run drafting on [Notion tender page URL].`
6. Run polish: `Read CLAUDE.md and agents/polish-agent.md. Polish the draft for [Notion tender page URL].`
7. Review polished output files in Drive. Send to client for review.

### Client Provides More Info
1. Update the client profile in Notion with new information
2. Re-run drafting with a specific prompt that names what changed: `Read CLAUDE.md and agents/drafting-agent.md. Re-run drafting on [Notion tender page URL]. [Describe exactly what arrived — e.g. "Pricing has been added for all product lines. Section 14.6 and the pricing sheet are now unblocked." or "Insurance cert uploaded to Drive. Modern Slavery questionnaire completed by Spiro."]`
3. Agent fills in only the placeholders affected by the new information. Unaffected sections are not re-read or rewritten.
4. Re-run polish after drafting updates.

**The more specific the re-run prompt, the faster and cheaper the agent run.** Vague prompts cause the agent to re-read everything to work out what changed.

### Submission
1. Check the submission checklist in Drive — all items should be ticked
2. Client signs declaration
3. Client uploads any documents only they can provide (insurance certs, signed forms)
4. Submit via the method specified in the tender (portal, email, physical)

### After Result
1. When a result is received, run debrief: `Read CLAUDE.md and agents/debrief-agent.md. Run debrief for [Notion tender page URL]. Result: [Won / Lost / No Award / Unsuccessful]. Feedback: [paste or "none received"].`
2. Review the learnings and follow-up actions flagged at the top of the debrief section
3. Any client profile updates made by the debrief agent are additive — review and confirm
4. If partial feedback arrives later (e.g. formal post-award debrief), re-run debrief with the new information. It will append, not overwrite.

## File Structure in Google Drive
```
TenderEngine/
├── Clients/
│   └── [Client Name]/
│       └── (company docs, insurance, past tenders)
└── Tenders/
    └── [Tender Reference - Short Name]/
        ├── [Original tender docs — read only]
        ├── DRAFT RESPONSE — [Reference].gdoc
        ├── DRAFT PRICING — [Reference].gsheet (if applicable)
        └── SUBMISSION CHECKLIST — [Reference].gdoc
```

## Rules
- Never invent client facts. If it's not in the profile, use a placeholder.
- Pass/fail items are always flagged first and loudest.
- Every tender gets a submission checklist.
- Output files mirror the tender structure exactly — same sections, same numbering, same headings.
- Re-runs update existing drafts, they don't rewrite from scratch.
- Internal risk notes are marked "do not forward to client".
- Write for the evaluator: professional, factual, evidence-based. No marketing fluff.
- **Always fetch the latest version of any document from Google Drive before starting work.** Never rely on a previously downloaded or cached copy. This applies to every agent on every run. If a document cannot be fetched, stop and report the error.

## Writing Style
- Direct and factual. Government evaluators read dozens of submissions — don't waste their time.
- Lead every scored section with what the evaluator asked for.
- Use specific evidence from the client profile (names, numbers, dates, locations).
- NEVER use: "purpose-built", "comprehensive", "robust", "holistic", "leveraging", "innovative", "cutting-edge", "best-in-class", "end-to-end", "seamless", "world-class", "delighted", "passionate"
- Short sentences. Active voice. No filler.
