import { type NextRequest, NextResponse } from "next/server";
import { SEED_TENDERS } from "@/lib/mock-data";
import { agentPrompt, notionPageUrl } from "@/lib/prompts";
import { serializeRun, startRun } from "@/lib/runs";
import type { AgentId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_AGENTS: readonly AgentId[] = [
  "onboarding",
  "triage",
  "drafting",
  "polish",
  "debrief",
];

interface RunBody {
  tenderId?: string;
  agentId?: AgentId;
  /** Free-form override — when provided, replaces the canonical prompt. */
  prompt?: string;
  /** Debrief only. */
  result?: string;
  feedback?: string;
  /** Drafting re-run: what arrived since last run. */
  extra?: string;
}

/**
 * POST /api/agents/run
 *
 * Spawn a `claude -p` subprocess running one of the five tender agents
 * against the given tender. The canonical prompt comes from lib/prompts.ts
 * (same wording as CLAUDE.md § Workflow). Returns the run record; poll
 * /api/agents/runs/:runId/events for live output.
 */
export async function POST(req: NextRequest) {
  let body: RunBody;
  try {
    body = (await req.json()) as RunBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { tenderId, agentId } = body;
  if (!tenderId || !agentId) {
    return NextResponse.json(
      { error: "tenderId and agentId are required" },
      { status: 400 },
    );
  }
  if (!VALID_AGENTS.includes(agentId)) {
    return NextResponse.json(
      { error: `agentId must be one of ${VALID_AGENTS.join(", ")}` },
      { status: 400 },
    );
  }

  const tender = SEED_TENDERS.find((t) => t.id === tenderId);
  if (!tender) {
    return NextResponse.json({ error: "tender not found" }, { status: 404 });
  }

  let prompt: string;
  try {
    if (body.prompt?.trim()) {
      prompt = body.prompt.trim();
    } else if (agentId === "onboarding") {
      if (!tender.clientId) {
        return NextResponse.json(
          { error: "tender has no linked client — cannot run onboarding" },
          { status: 400 },
        );
      }
      prompt = agentPrompt(agentId, {
        clientPageUrl: notionPageUrl(tender.clientId),
      });
    } else {
      prompt = agentPrompt(agentId, {
        tenderPageUrl: notionPageUrl(tender.id),
        result: body.result,
        feedback: body.feedback,
        extra: body.extra,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }

  const record = startRun({ tenderId, agentId, prompt });
  return NextResponse.json(serializeRun(record));
}
