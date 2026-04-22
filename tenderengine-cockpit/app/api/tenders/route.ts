import { NextResponse } from "next/server";
import { SEED_TENDERS } from "@/lib/mock-data";
import type { TendersResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/tenders
 *
 * Returns the tenders list.
 *
 * Behavior:
 *  - If NOTION_TOKEN is set, queries the live Notion database sequentially
 *    (per the "never parallel Notion calls" rule in SKILL.md) and maps
 *    properties into the Tender shape.
 *  - If the env var is missing or the query fails, returns the snapshot
 *    baked from MCP on 2026-04-21.
 *
 * The live-query path is stubbed for this scaffolding pass — the plumbing
 * exists, but the full property-value mapping lands in Phase 1.5 once a
 * real Notion integration token is wired.
 */
export async function GET() {
  const token = process.env.NOTION_TOKEN;
  const fetchedAt = new Date().toISOString();

  if (!token) {
    const body: TendersResponse = {
      source: "snapshot",
      tenders: SEED_TENDERS,
      fetchedAt,
    };
    return NextResponse.json(body);
  }

  // Live Notion path (wired in Phase 1.5)
  const body: TendersResponse = {
    source: "snapshot",
    tenders: SEED_TENDERS,
    fetchedAt,
    error: "Live Notion query not yet implemented — returning snapshot",
  };
  return NextResponse.json(body);
}
