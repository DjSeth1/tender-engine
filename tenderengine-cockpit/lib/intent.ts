/**
 * Chat-bar intent detection.
 *
 * Phase 1: regex-only parser covering the eight or so verbs the operator
 * actually uses. Unknown input falls through as a free-form chat turn.
 * Phase 1.5 replaces this with a Haiku-4.5 classifier on the server.
 */

import type { AgentId, Tender } from "./types";

export type Intent =
  | {
      kind: "run-agent";
      agentId: AgentId;
      tenderMatch?: string;
      /** Debrief: "Won" / "Lost" / etc. */
      result?: string;
      feedback?: string;
      /** Drafting re-run description. */
      extra?: string;
    }
  | {
      kind: "cancel";
      tenderMatch?: string;
    }
  | { kind: "unknown"; text: string };

const AGENT_ALIASES: Record<string, AgentId> = {
  onboarding: "onboarding",
  onboard: "onboarding",
  triage: "triage",
  drafting: "drafting",
  draft: "drafting",
  polish: "polish",
  polishing: "polish",
  debrief: "debrief",
};

export function parseIntent(raw: string): Intent {
  const text = raw.trim();
  if (!text) return { kind: "unknown", text };

  const lower = text.toLowerCase();

  // "cancel" / "stop"
  if (/^(cancel|stop|kill|abort)\b/.test(lower)) {
    const m = lower.match(/\bon\s+([a-z0-9/_\-.]+)/);
    return { kind: "cancel", tenderMatch: m?.[1] };
  }

  // "run triage on T26/10" / "re-run drafting" / "start polish" / "polish T26/10"
  const verbMatch = lower.match(
    /^(?:re-?run|run|start|kick\s?off|do)\s+(onboarding|onboard|triage|drafting|draft|polish|polishing|debrief)\b/,
  );
  let agentId: AgentId | undefined;
  let rest = text;
  if (verbMatch) {
    agentId = AGENT_ALIASES[verbMatch[1]];
    rest = text.slice(verbMatch[0].length);
  } else {
    const implicit = lower.match(
      /^(onboarding|onboard|triage|drafting|draft|polish|polishing|debrief)\b/,
    );
    if (implicit) {
      agentId = AGENT_ALIASES[implicit[1]];
      rest = text.slice(implicit[0].length);
    }
  }

  if (agentId) {
    const onMatch = rest.match(/\bon\s+([A-Za-z0-9/_\-.]+)/i);
    const tenderMatch = onMatch?.[1];

    // Debrief: "result: Won. feedback: ..."
    let result: string | undefined;
    let feedback: string | undefined;
    const resultMatch = rest.match(/\bresult\s*[:=]\s*([^.\n]+?)(?=\s*(?:feedback\s*[:=]|$))/i);
    if (resultMatch) result = resultMatch[1].trim();
    const feedbackMatch = rest.match(/\bfeedback\s*[:=]\s*([\s\S]+)$/i);
    if (feedbackMatch) feedback = feedbackMatch[1].trim();

    // Drafting: free-form "what changed" after the tender ref
    let extra: string | undefined;
    if (agentId === "drafting" && !result && !feedback) {
      const after = onMatch
        ? rest.slice((onMatch.index ?? 0) + onMatch[0].length)
        : rest;
      const trimmed = after.replace(/^[\s.,;:-]+/, "").trim();
      if (trimmed.length > 6) extra = trimmed;
    }

    return { kind: "run-agent", agentId, tenderMatch, result, feedback, extra };
  }

  return { kind: "unknown", text };
}

/**
 * Resolve "T26/10" / "CP028" / "belroy" style references against a tender
 * list. Case-insensitive; matches against reference, then name, then client.
 */
export function resolveTenderMatch(
  match: string | undefined,
  tenders: Tender[],
  fallbackId: string | null,
): Tender | null {
  if (!match) {
    return tenders.find((t) => t.id === fallbackId) ?? null;
  }
  const needle = match.toLowerCase();
  return (
    tenders.find((t) => t.reference.toLowerCase() === needle) ??
    tenders.find((t) => t.reference.toLowerCase().includes(needle)) ??
    tenders.find((t) => t.name.toLowerCase().includes(needle)) ??
    tenders.find((t) => t.clientName.toLowerCase().includes(needle)) ??
    null
  );
}
