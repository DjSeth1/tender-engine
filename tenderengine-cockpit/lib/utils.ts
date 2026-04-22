import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Tender, TenderResult, TenderStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Days from now until an ISO date. Positive = future, negative = past. */
export function daysUntil(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - now;
  return Math.ceil(ms / 86_400_000);
}

export function formatDaysLeft(
  days: number | null,
  status: TenderStatus,
  result: TenderResult | null,
): string {
  if (result === "Won") return "won";
  if (result === "Lost") return "lost";
  if (result === "No Award") return "no award";
  if (status === "Submitted") return "sent";
  if (status === "Not Doing") return "skipped";
  if (status === "Archived") return "—";
  if (days === null) return "—";
  if (days > 0) return `${days}d`;
  if (days === 0) return "today";
  return `${Math.abs(days)}d ago`;
}

export function statusDotColor(status: TenderStatus, result: TenderResult | null): string {
  if (result === "Won") return "var(--te-good)";
  if (result === "Lost") return "var(--te-block)";
  const map: Record<TenderStatus, string> = {
    Drafting: "var(--te-accent)",
    Review: "var(--te-accent)",
    New: "var(--te-warn)",
    "Gathering Info": "var(--te-warn)",
    "Needs Info": "var(--te-warn)",
    "Ready for Submission": "var(--te-good)",
    Blocked: "var(--te-block)",
    Submitted: "var(--te-muted)",
    "Not Doing": "var(--te-muted-soft)",
    Archived: "var(--te-muted-soft)",
    "MIR Email Sent": "var(--te-warn)",
  };
  return map[status] ?? "var(--te-muted)";
}

/**
 * Rail sort order.
 * Closest-deadline first, except submitted / won / lost / not-doing / archived
 * sink to the bottom, sorted newest-first within that bucket.
 */
export function sortByUrgency(a: Tender, b: Tender, now = Date.now()): number {
  const bottomStatuses: TenderStatus[] = ["Submitted", "Not Doing", "Archived"];
  const resolvedResults: TenderResult[] = ["Won", "Lost", "No Award"];
  const isBottom = (t: Tender) =>
    bottomStatuses.includes(t.status) ||
    (t.result !== null && resolvedResults.includes(t.result));

  const aBottom = isBottom(a);
  const bBottom = isBottom(b);
  if (aBottom && !bBottom) return 1;
  if (!aBottom && bBottom) return -1;

  const ad = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
  const bd = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;

  if (aBottom && bBottom) return bd - ad; // newest-resolved first
  return ad - bd; // closest-deadline first
}

export function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
