import { type NextRequest, NextResponse } from "next/server";
import { listRuns, serializeRun } from "@/lib/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/agents/runs?tenderId=<id>
 *
 * List agent runs. If tenderId is omitted, returns every run in the registry.
 * The client uses this on tender switch to re-attach to any in-flight runs.
 */
export async function GET(req: NextRequest) {
  const tenderId = req.nextUrl.searchParams.get("tenderId") ?? undefined;
  const runs = listRuns(tenderId).map(serializeRun);
  runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return NextResponse.json({ runs });
}
