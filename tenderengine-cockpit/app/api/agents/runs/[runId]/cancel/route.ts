import { type NextRequest, NextResponse } from "next/server";
import { cancelRun, getRun, serializeRun } from "@/lib/runs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { runId: string } },
) {
  const r = getRun(params.runId);
  if (!r) return NextResponse.json({ error: "run not found" }, { status: 404 });
  const ok = cancelRun(params.runId);
  if (!ok) {
    return NextResponse.json(
      { error: "run is not cancellable (already finished)" },
      { status: 400 },
    );
  }
  return NextResponse.json(serializeRun(r));
}
