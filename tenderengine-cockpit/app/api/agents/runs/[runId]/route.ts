import { type NextRequest, NextResponse } from "next/server";
import { getRun, serializeRun } from "@/lib/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { runId: string } },
) {
  const r = getRun(params.runId);
  if (!r) return NextResponse.json({ error: "run not found" }, { status: 404 });
  return NextResponse.json(serializeRun(r));
}
