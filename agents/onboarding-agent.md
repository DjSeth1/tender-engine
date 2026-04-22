# Onboarding Agent

## Purpose
Audit a new client's Google Drive folder and Notion profile. Catalogue everything that exists, assess its quality and currency, map it against what tenders typically require, and produce a structured gap report with a client-ready shopping list. This agent runs once per new client, before any triage work begins, and can be re-run after the client provides additional documents.

## When to Run
- When a new client is added to the TenderEngine Clients database
- When a client's Drive folder has been updated with new documents and you want to reassess readiness
- Before running triage on the first tender for any client

**Prompt:** `Read CLAUDE.md and agents/onboarding-agent.md. Run onboarding audit for [Notion client page URL].`

## Inputs
- Client page from the TenderEngine Clients database in Notion (for company details, contacts, sector)
- Client folder in Google Drive under TenderEngine/Clients/[Client Name]/
- The expected folder structure from the Google Drive Cheat Sheet

## Process

### Step 1: Read the Notion client profile
Pull all fields from the client record: Company Name, Trading Name, ABN, ACN, Contact Name, Contact Email, Contact Phone, Sectors, Drive Folder link, Notes, Standard Rates, Profile Status. Note which fields are populated and which are empty.

### Step 2: Create or verify Drive folder structure
Navigate to the client's Drive folder. If the folder or any expected subfolders are missing, create them:
- Insurance & Certs/
- Personnel/
- Policies/
- Past Tenders/
- Past Projects/
- Capability Statements/

If the Drive folder link doesn't exist or is inaccessible, stop and report the error. Do not proceed without a valid Drive folder.

### Step 3: Scan the Drive folder
List every file across all subfolders. For each file record: file name, file type (PDF/Word/image/etc), subfolder location, file size, last modified date.

### Step 4: Read and assess each document
Open and read every document in the folder. For each document, determine:
- **What it is:** insurance certificate, CV, policy document, case study, capability statement, reference letter, licence, accreditation, quote template, etc.
- **What it covers:** which tender requirement categories it could serve (compliance, personnel, experience, methodology, quality, WHS, environment, pricing)
- **Currency:** is it current or expired? Check dates on insurance certs, accreditations, licences. Flag anything expiring within 90 days.
- **Quality:** is it detailed enough to be useful in a tender response? A one-page CV with just job titles is low quality. A CV with responsibilities, achievements, and qualifications is high quality. A case study with metrics and outcomes is high quality. A generic project list is low quality.
- **Reusability:** could content from this document be directly quoted or adapted in a tender response?

### Step 5: Map against tender requirements
Cross-reference everything found against the standard requirements checklist:

**Company fundamentals (MUST HAVE)**
- ABN / ACN
- Company registration details
- Trading name (if different)
- Company overview / capability statement
- Organisational structure

**Insurance & compliance (MUST HAVE)**
- Public liability insurance (current, with amount)
- Workers compensation insurance (current)
- Professional indemnity insurance (if applicable to sector)
- Product liability insurance (if applicable to sector)
- Any sector-specific insurance (food safety, liquor liability, etc.)

**Personnel (SHOULD HAVE)**
- Key personnel CVs with qualifications
- Org chart or team structure
- Staff numbers and roles
- Relevant licences and accreditations (trade certs, food handling, RSA, etc.)

**Policies (SHOULD HAVE)**
- WHS / OHS policy or management plan
- Environmental / sustainability policy
- Quality management policy or system
- Modern slavery statement (if applicable)
- Privacy policy
- Equal opportunity / diversity policy

**Experience & evidence (SHOULD HAVE)**
- Past project summaries or case studies (minimum 3)
- Reference contacts with names, titles, organisations, phone/email
- Past tender responses (for reuse of strong content)
- Reference letters or testimonials
- Performance data or metrics

**Pricing (NICE TO HAVE for onboarding)**
- Standard rate card or pricing schedule
- Cost structure breakdown

For each item, mark:
- FOUND (with file name and quality rating)
- PARTIAL (exists but incomplete, expired, or low quality)
- MISSING (not found anywhere in Drive or Notion profile)

### Step 6: Produce readiness score
Calculate a simple readiness percentage:
- Count total items on the checklist relevant to the client's sector
- Count items marked FOUND
- Readiness = FOUND / Total relevant items

Classify:
- 80%+ = **Ready** (can run triage on most tenders with minimal gaps)
- 50-79% = **In Progress** (significant gaps will slow tender turnaround)
- Below 50% = **Incomplete** (must resolve gaps before running tenders efficiently)

### Step 7: Draft the outreach email
Write a ready-to-send email to the client (addressed to the contact name from the Notion profile) requesting only the items that are MISSING or PARTIAL. Do not list items that are already FOUND.

The email should:
- Open with one sentence explaining why we need these documents (tender submissions require specific evidence)
- List only missing/partial items, grouped by urgency (must have / should have / nice to have)
- For each item, include one sentence on what format to provide it in and what information must be visible (e.g. "Public liability insurance certificate as a PDF — insurer name, policy number, coverage amount, and expiry date must be visible.")
- Close with a clear call to action: reply with the documents attached, or flag if any items don't apply
- Tone: professional, direct, not jargon-heavy. The client is a busy operator, not a tender professional.

If nothing is missing, note that the profile is complete and no email is needed.

### Step 8: Write to Notion
**Update client profile properties:**
- Profile Status: set to Ready / In Progress / Incomplete based on readiness score

**Write to client page body:**
- The draft outreach email (the primary deliverable — clearly labelled "DRAFT EMAIL — READY TO SEND")
- A checklist of missing items as Notion checkboxes so items can be ticked off as documents arrive without re-running the agent
- Internal notes section (marked "INTERNAL — DO NOT FORWARD") covering: quality flags, expired documents, items that are thin or borderline, anything the partner needs to know before running tenders

**Update Agent Notes on client page** with a one-line summary: "Onboarding audit complete. Readiness: [X]%. [Y] items missing. Key blockers: [list]."

**Write agent run stats block** at the bottom of the client page body (after internal notes):

```
---
Agent run stats — Onboarding — [date]
Docs reviewed: [N] | Items missing: [N] | Items found: [N] | Items partial: [N]
Time saved (est.): [N] hrs (benchmark: 45 min for new client with empty folder, +10 min per 5 docs reviewed)
```

**Update Notion properties:**
- Time Saved (hrs): calculated from benchmark above
- Docs Reviewed: total files read across Drive folder
- Items Missing: total items marked MISSING in requirements mapping

## Re-run Behaviour
When re-run after new documents are added:
1. Read existing audit from the client page body
2. Check the shopping list checkboxes — items already ticked are resolved, skip them
3. Scan Drive folder for new or updated files since the last audit date
4. Re-assess only changed/new items
5. Update the requirements mapping and readiness score
6. Tick off resolved items in the shopping list. Do not delete them — ticked items are a record of what was received and when
7. Update Profile Status if readiness has changed
8. Append to Agent Notes: "Re-audit [date]. Readiness moved from [X]% to [Y]%. Resolved: [items]. Still outstanding: [items]."

## Key Principles
1. Read every document, not just file names. A file called "insurance.pdf" might be expired or might be the wrong type.
2. Currency matters. An expired insurance cert is worse than no cert because it creates a false sense of readiness.
3. The shopping list is a deliverable. It goes to the client. Write it clearly.
4. Quality assessment is subjective but important. A thin CV that just lists job titles will not help the drafting agent write a strong personnel section. Flag it.
5. Sector awareness. A cleaning company needs different docs than a wine merchant. Use the Sectors field from the client profile to adjust what's relevant.
6. Never fabricate readiness. If the folder is empty, say so clearly. An honest "Incomplete" is better than a padded "In Progress".
