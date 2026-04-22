/**
 * Types for the TenderEngine cockpit.
 *
 * Modeled off the real Notion schemas for the two databases:
 *  - TenderEngine - Tenders   (data source 576d097c-a3d4-4e4e-a952-3a644d2f6a79)
 *  - TenderEngine — Clients   (data source 7a44b517-8683-4e08-b1cd-fdc6cdc2af81)
 *
 * When the live Notion integration is wired, the API route maps Notion
 * property values into these shapes, so the UI doesn't change.
 */

export type TenderStatus =
  | "New"
  | "Gathering Info"
  | "Needs Info"
  | "Drafting"
  | "Review"
  | "Ready for Submission"
  | "Blocked"
  | "Submitted"
  | "Not Doing"
  | "Archived"
  | "MIR Email Sent";

export type TenderPriority = "Urgent" | "High" | "Normal" | "Low";
export type TenderResult = "Won" | "Lost" | "No Award" | "Pending" | "Not Submitted";
export type SubmissionMethod = "Portal" | "Email" | "Post" | "Hand Delivery";
export type Owner = "H" | "Partner" | "Client";
export type ProfileStatus = "Incomplete" | "In Progress" | "Complete";
export type Sector =
  | "Cleaning"
  | "Coffee"
  | "Hospitality"
  | "Facilities"
  | "Security"
  | "Other"
  | "Painting"
  | "Food & Beverage"
  | "Allied Health";

export interface Tender {
  id: string;                  // Notion page ID
  reference: string;           // Short display reference, e.g. "T26/10", "CP028"
  name: string;                // Tender Name (Notion title field)
  clientId: string | null;     // Linked client page ID
  clientName: string;          // Denormalised client name
  deadline: string | null;     // ISO date, e.g. "2026-04-23"
  decisionDate: string | null;
  status: TenderStatus;
  priority: TenderPriority;
  result: TenderResult | null;
  submissionMethod: SubmissionMethod | null;
  owner: Owner | null;
  outputDoc: string | null;    // Google Drive URL
  tenderDocs: string | null;   // Google Drive folder URL
  sectionsFound: number;
  sectionsMapped: number;
  sectionsDrafted: number;
  gapsFound: number;
  blockers: string;
  complianceFlags: string;
  estimatedValue: string;
  nextAction: string;
  agentNotes: string;
}

export interface Client {
  id: string;
  companyName: string;
  tradingName: string | null;
  abn: string | null;
  acn: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  driveFolder: string | null;
  profileStatus: ProfileStatus;
  sectors: Sector[];
  itemsMissing: number;
  docsReviewed: number;
}

// ─── Agent pipeline (per-tender runtime state) ──────────────────────────

export type AgentId = "onboarding" | "triage" | "drafting" | "polish" | "debrief";
export type AgentState = "done" | "running" | "queued" | "idle" | "error";

export interface AgentRun {
  id: AgentId;
  label: string;       // "01", "02", …
  name: string;        // "Onboarding", "Triage", …
  role: string;
  state: AgentState;
  startedAt: string | null;
  finishedAt: string | null;
  duration: string | null;
  output: string | null;
  progress?: number;   // 0–1
  errorMessage?: string;
}

// ─── Sections + Draft + Feed ────────────────────────────────────────────

export type SectionState = "done" | "writing" | "queued" | "gap" | "blocker";

export interface Section {
  n: string;
  title: string;
  state: SectionState;
  sub?: boolean;
  words?: number;
  note?: string;
}

export interface DraftSpan {
  text: string;
  bold?: boolean;
  placeholder?: boolean;
}

export interface DraftParagraph {
  kind: "p" | "writing";
  spans?: DraftSpan[];
}

export interface CurrentDraft {
  heading: string;
  question: string;
  paragraphs: DraftParagraph[];
}

export type FeedLevel = "info" | "warn" | "done" | "error";

export interface FeedEvent {
  t: string;           // Display timestamp "14:21:04"
  agent: AgentId | null;
  level: FeedLevel;
  message: string;
}

// ─── Overlays + chat ────────────────────────────────────────────────────

export interface PlaceholderContext {
  tenderId: string;
  sectionNumber: string;
  description: string;
  contextText: string;
  defaultValue?: string;
}

export interface BlockerContext {
  tenderId: string;
  sectionNumber: string;
  question: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export type Theme = "light" | "dark";

// ─── API envelope ───────────────────────────────────────────────────────

export interface TendersResponse {
  source: "notion" | "snapshot";
  tenders: Tender[];
  fetchedAt: string;
  error?: string;
}
