# Debrief Agent

## Purpose
Run after a submitted tender has received a result. Capture the outcome, extract learnings, enrich the client profile with anything new the bid surfaced, and record sector intelligence that will help future tenders. This is the last agent in the pipeline and the only one that feeds learnings back into the system.

## When to Run
- As soon as a result has been received (Won, Lost, No Award, Unsuccessful, Withdrawn)
- After any formal debrief meeting with the tendering authority
- When scoring breakdown or evaluator feedback has been shared (even partial)

**Prompt:** `Read CLAUDE.md and agents/debrief-agent.md. Run debrief for [Notion tender page URL]. Result: [Won / Lost / No Award / Unsuccessful]. Feedback: [paste feedback, or "none received"].`

## Inputs
- Notion tender page (with full triage, drafting history, polish notes, final submission content)
- Notion client page linked to the tender
- Final submitted documents in Google Drive (Output folder)
- Any feedback supplied by the user: scoring sheet, debrief notes, evaluator comments, competitor info, price comparison, shortlist position
- The result itself (Won / Lost / No Award / Unsuccessful / Withdrawn)

## Pre-flight Checks
Confirm: tender status is Submitted or later, final submitted version of output files is accessible in Drive, client profile is linked, a result has been supplied in the prompt. **Download the latest version of all relevant documents from Google Drive. Never rely on cached copies.** If the final submitted files cannot be fetched, stop and report the error.

## Process

### Step 1: Read the full tender record
Pull the complete Notion tender page: triage output, gap analysis, drafting history, polish notes, agent run stats. Note which placeholders were resolved before submission and which were waived. Note the final section count, any compliance flags, and the final submission date.

### Step 2: Read the final submitted output
Fetch the final submitted Google Doc, pricing sheet, and submission checklist from Drive. Confirm which version was actually lodged. If multiple versions exist, the debrief must reference the version submitted, not the latest draft.

### Step 3: Record the result
Capture the headline outcome exactly as supplied: Won, Lost, No Award, Unsuccessful, or Withdrawn. Note the date the result was received. If a scoring breakdown has been supplied, record section-by-section scores. If the winning price or competitor was disclosed, record that too. Never infer a result the user has not stated.

### Step 4: Analyse what the feedback says
If evaluator feedback is available, work through it methodically:
- **Scored sections:** for each scored section where feedback exists, record the score, the evaluator comment, and map it back to what was drafted. Was the gap evidence-based (thin client profile) or draft-based (the agent underplayed strong evidence)?
- **Pass/fail items:** if any pass/fail item was cited as a reason for non-award, record which item, which tender clause, and what the client currently holds versus what was required.
- **Pricing:** if price was a factor, record how the client's price compared to the winning price or benchmark. Do not speculate beyond what the feedback says.
- **Structural issues:** if the feedback cites formatting, missing documents, late submission, or template non-compliance, these are process failures, not content failures. Flag them separately.

If no feedback has been received, say so plainly. Do not invent reasons for the result.

### Step 5: Extract learnings
Separate learnings into three buckets:

**Client profile learnings** — information that surfaced during this bid (new certifications, new personnel, new case studies, updated insurance, new capabilities) that should be added to the permanent client profile. These are reusable across future tenders.

**Sector intelligence** — information about this buyer, this procurement type, or this sector that will help on future tenders: evaluation preferences, common pass/fail items, recurring schedule formats, quirks in the portal or submission process, price expectations, recurring incumbents.

**Process learnings** — issues with how the tender was run internally: gaps that were flagged late, re-runs that wasted effort, placeholders that were never resolved, sections that were drafted but did not score well. These feed back into how future tenders are handled.

Every learning must be specific. "Our methodology section scored 7/10 because we did not address the transition plan sub-criterion" is useful. "Methodology needs work" is not.

### Step 6: Update the client profile
Write any Client profile learnings directly into the client Notion page. Add new personnel, certifications, projects, or policies as structured additions to the existing profile. Never overwrite existing profile content. Append, label with the source tender reference, and date the addition.

**Update client profile properties where applicable:**
- Add any newly documented certifications, insurances, or accreditations
- Update "Past Tenders" with this tender's result
- Update Profile Status if readiness has changed materially

If a document was uploaded to Drive during the bid that should live permanently in the client folder (e.g. a signed policy, a new CV, an insurance cert), note the file and its Drive location. If it is currently in the tender folder but belongs in the client folder, flag it for manual move. Never move files automatically.

### Step 7: Record sector intelligence
Append sector intelligence findings to an "INTERNAL — SECTOR INTELLIGENCE" section on the client Notion page. Tag each finding with the tender reference and date so its source is traceable. This section is internal and is never forwarded to the client.

If sector findings are broad enough to apply across multiple clients (e.g. "NSW Health panel tenders require evidence of Modern Slavery Statement lodged with the register"), flag them in the debrief summary so the partner can decide whether to add them to a shared sector library.

### Step 8: Write the debrief report to Notion
Append a dated debrief section to the tender Notion page body. Structure:

- **Result** — Won / Lost / No Award / Unsuccessful / Withdrawn, date received
- **Scores** (if supplied) — section-by-section breakdown
- **Pricing outcome** (if supplied) — client's price versus winning or benchmark price
- **What the feedback said** — direct quotes or close paraphrase, grouped by scored section
- **Root cause analysis** — for each loss point, whether it was an evidence gap, a drafting gap, a pricing gap, or a process gap
- **Client profile learnings** — list, with a note on what has been added to the client page
- **Sector intelligence** — list, with a note on what has been added to the client page sector section
- **Process learnings** — list, for internal use
- **What would change next time** — short, specific list of actions that would lift the next bid (e.g. "Secure PI insurance upgrade to $20M before next Part B tender" or "Case study for aged care sector needed — current evidence too thin")

Label the section with the date and tender reference. Do not overwrite any prior debrief content if this tender has been debriefed before (rare, but possible after a formal post-award meeting).

### Step 9: Update Notion tender properties
- **Status:** set to the appropriate terminal status (Won / Lost / No Award / Unsuccessful / Withdrawn)
- **Result Date:** the date the result was received
- **Final Score** (if supplied): record as a property if the Notion schema supports it
- **Agent Notes:** append a one-line debrief summary: "Debrief complete [date]. Result: [X]. Key learnings: [Y]. Client profile updated: [Z items]."

### Step 10: Flag follow-up actions
If the debrief surfaces anything that needs immediate partner action (e.g. "client must secure PI insurance upgrade before next bid in this sector", "reference list is stale — three of four referees have moved on"), create a clearly marked FOLLOW-UP ACTIONS block at the top of the debrief section. The partner needs to see these without reading the full report.

### Step 11: Write agent run stats block
Append at the bottom of the tender Notion page body:

```
---
Agent run stats — Debrief — [date]
Result: [Won / Lost / No Award / Unsuccessful / Withdrawn]
Feedback received: [Yes / No / Partial]
Profile items added: [N] | Sector intel items added: [N] | Process learnings: [N]
Time saved (est.): [N] hrs (benchmark: 30 min per scored section analysed + 30 min for profile enrichment + 15 min for sector intelligence capture)
```

**Update Notion properties:**
- Time Saved (hrs): add to existing value (cumulative across all agent runs on this tender)

## Re-run Behaviour
Debrief is normally run once per tender, at result time. It can be re-run if:
- Additional feedback arrives later (formal post-award debrief, scoring released late)
- The user wants to reprocess learnings after a delay

On re-run, append a new dated debrief section. Never overwrite a prior debrief. The history is the audit trail.

## Key Principles
1. Never invent a result, a score, or a reason for a loss. If the user has not supplied it, say so.
2. Every learning must be specific enough to act on. Vague learnings are worthless.
3. Separate evidence gaps from drafting gaps from process gaps. Fixing the wrong problem is worse than fixing nothing.
4. The client profile is a living record. Every bid should enrich it.
5. Sector intelligence is the long-term moat. Capture it every time.
6. Follow-up actions go at the top, loud and dated. The partner should not have to dig for them.
7. Internal notes are marked "INTERNAL — DO NOT FORWARD." The debrief is not a client-facing document.
8. **Zero assumptions on feedback.** If evaluator feedback is ambiguous (e.g. "methodology could have been stronger"), record it verbatim and flag that it needs clarification at the next opportunity. Never translate vague feedback into specific action items the evaluator did not say.
