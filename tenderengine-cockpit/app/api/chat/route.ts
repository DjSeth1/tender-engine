import { type NextRequest, NextResponse } from "next/server";
import { SEED_TENDERS } from "@/lib/mock-data";
import { parseIntent, resolveTenderMatch } from "@/lib/intent";
import { agentPrompt, notionPageUrl } from "@/lib/prompts";
import { cancelRun, listRuns, serializeRun, startRun } from "@/lib/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatBody {
  input?: string;
  activeTenderId?: string | null;
}

/**
 * POST /api/chat
 *
 * Parses the chat-bar input. Known intents ("run triage on T26/10",
 * "cancel", "debrief result: Won") spawn or stop an agent run and return
 * the run record. Unknown input is echoed back as a system message the
 * chat bar can display — no free-form LLM chat yet (Phase 1.5).
 */
export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const input = body.input?.trim() ?? "";
  if (!input) {
    return NextResponse.json({ error: "input required" }, { status: 400 });
  }

  const intent = parseIntent(input);

  if (intent.kind === "run-agent") {
    const tender = resolveTenderMatch(
      intent.tenderMatch,
      SEED_TENDERS,
      body.activeTenderId ?? null,
    );
    if (!tender) {
      return NextResponse.json({
        kind: "unresolved",
        reply:
          intent.tenderMatch
            ? `Couldn't find a tender matching "${intent.tenderMatch}". Try the reference (e.g. T26/10).`
            : "No active tender — click one in the rail first, or say \"run triage on <ref>\".",
      });
    }

    try {
      let prompt: string;
      if (intent.agentId === "onboarding") {
        if (!tender.clientId) {
          return NextResponse.json({
            kind: "unresolved",
            reply: `${tender.reference} has no linked client — can't run onboarding.`,
          });
        }
        prompt = agentPrompt("onboarding", {
          clientPageUrl: notionPageUrl(tender.clientId),
        });
      } else {
        prompt = agentPrompt(intent.agentId, {
          tenderPageUrl: notionPageUrl(tender.id),
          result: intent.result,
          feedback: intent.feedback,
          extra: intent.extra,
        });
      }

      const record = startRun({
        tenderId: tender.id,
        agentId: intent.agentId,
        prompt,
      });

      return NextResponse.json({
        kind: "run-started",
        tenderId: tender.id,
        run: serializeRun(record),
      });
    } catch (err) {
      return NextResponse.json(
        { kind: "error", reply: (err as Error).message },
        { status: 400 },
      );
    }
  }

  if (intent.kind === "cancel") {
    const tender = resolveTenderMatch(
      intent.tenderMatch,
      SEED_TENDERS,
      body.activeTenderId ?? null,
    );
    if (!tender) {
      return NextResponse.json({
        kind: "unresolved",
        reply: "Which tender? Try \"cancel on T26/10\".",
      });
    }
    const running = listRuns(tender.id).filter((r) => r.state === "running");
    if (running.length === 0) {
      return NextResponse.json({
        kind: "unresolved",
        reply: `No running agents on ${tender.reference}.`,
      });
    }
    const cancelled = running.filter((r) => cancelRun(r.runId));
    return NextResponse.json({
      kind: "cancelled",
      tenderId: tender.id,
      runIds: cancelled.map((r) => r.runId),
      reply: `Cancelled ${cancelled.length} run${cancelled.length === 1 ? "" : "s"} on ${tender.reference}.`,
    });
  }

  return NextResponse.json({
    kind: "unknown",
    reply:
      'Try: "run triage on T26/10", "re-run drafting", "polish", "debrief result: Won", or "cancel".',
  });
}
