/**
 * Canonical agent prompts.
 *
 * Mirrors the wording in CLAUDE.md § Workflow so that hitting "Run triage" in
 * the cockpit is identical to pasting the prompt into Claude Code by hand.
 */

import type { AgentId } from "./types";

/** Notion accepts dashless page IDs in URLs and resolves them to the page. */
export function notionPageUrl(id: string): string {
  return `https://www.notion.so/${id.replace(/-/g, "")}`;
}

export interface AgentPromptArgs {
  tenderPageUrl?: string;
  clientPageUrl?: string;
  /** Debrief: "Won" / "Lost" / "No Award" / "Unsuccessful" / etc. */
  result?: string;
  /** Debrief: evaluator feedback or "none received". */
  feedback?: string;
  /** Drafting re-run: description of what changed since last run. */
  extra?: string;
}

export function agentPrompt(agentId: AgentId, args: AgentPromptArgs): string {
  switch (agentId) {
    case "onboarding": {
      if (!args.clientPageUrl) throw new Error("onboarding requires clientPageUrl");
      return `Read CLAUDE.md and agents/onboarding-agent.md. Run onboarding audit for ${args.clientPageUrl}.`;
    }
    case "triage": {
      if (!args.tenderPageUrl) throw new Error("triage requires tenderPageUrl");
      return `Read CLAUDE.md and agents/triage-agent.md. Run triage on ${args.tenderPageUrl}.`;
    }
    case "drafting": {
      if (!args.tenderPageUrl) throw new Error("drafting requires tenderPageUrl");
      const suffix = args.extra ? ` ${args.extra.trim()}` : "";
      return `Read CLAUDE.md and agents/drafting-agent.md. Run drafting on ${args.tenderPageUrl}.${suffix}`;
    }
    case "polish": {
      if (!args.tenderPageUrl) throw new Error("polish requires tenderPageUrl");
      return `Read CLAUDE.md and agents/polish-agent.md. Polish the draft for ${args.tenderPageUrl}.`;
    }
    case "debrief": {
      if (!args.tenderPageUrl) throw new Error("debrief requires tenderPageUrl");
      const result = args.result?.trim() || "Pending";
      const feedback = args.feedback?.trim() || "none received";
      return `Read CLAUDE.md and agents/debrief-agent.md. Run debrief for ${args.tenderPageUrl}. Result: ${result}. Feedback: ${feedback}.`;
    }
  }
}
