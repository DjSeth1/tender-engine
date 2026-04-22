"use client";

import type { ReactNode } from "react";
import { useStore, selectActiveTender } from "@/lib/store";
import { Eyebrow } from "@/components/primitives/eyebrow";
import { Rule } from "@/components/primitives/rule";
import { daysUntil, formatDaysLeft } from "@/lib/utils";
import { PipelineCards } from "./pipeline-cards";
import { FeedPane } from "./feed-pane";

export function MainPanel() {
  const active = useStore(selectActiveTender);

  if (!active) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: 40,
          color: "var(--te-muted)",
        }}
      >
        <Eyebrow>No tender selected</Eyebrow>
      </div>
    );
  }

  const days = daysUntil(active.deadline);
  const daysLabel = formatDaysLeft(days, active.status, active.result);
  const draftedPct = active.sectionsMapped
    ? Math.round((active.sectionsDrafted / active.sectionsMapped) * 100)
    : 0;

  return (
    <div
      style={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      {/* Hero */}
      <div style={{ padding: "22px 28px 6px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 24,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Eyebrow style={{ marginBottom: 6 }}>
              Now {active.status.toLowerCase()} · {active.reference}
            </Eyebrow>
            <h1
              className="font-te-serif"
              style={{
                fontSize: 30,
                fontWeight: 400,
                letterSpacing: -0.6,
                margin: 0,
                color: "var(--te-ink)",
                lineHeight: 1.15,
              }}
            >
              {active.name}
            </h1>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--te-muted)",
                marginTop: 4,
              }}
            >
              for{" "}
              <span style={{ color: "var(--te-ink)" }}>{active.clientName}</span>
              {active.submissionMethod && (
                <>
                  {" · "}
                  {active.submissionMethod.toLowerCase()}
                </>
              )}
              {active.priority !== "Normal" && (
                <>
                  {" · "}
                  {active.priority.toLowerCase()} priority
                </>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
            <BigStat
              label="Deadline"
              value={daysLabel}
              sub={active.deadline ?? "—"}
              danger={days !== null && days >= 0 && days <= 2}
            />
            <BigStat
              label="Sections"
              value={`${active.sectionsDrafted}/${active.sectionsMapped || active.sectionsFound}`}
              sub={`${draftedPct}%`}
            />
            <BigStat
              label="Gaps"
              value={String(active.gapsFound)}
              sub={active.gapsFound > 0 ? "to resolve" : "clear"}
              danger={active.gapsFound > 0}
            />
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div style={{ padding: "16px 28px 20px" }}>
        <PipelineCards />
      </div>

      <Rule />

      {/* Body (238 / 1fr / 324) */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "238px 1fr 324px",
          minHeight: 0,
        }}
      >
        <StubColumn
          label="Sections"
          hint={`${active.sectionsDrafted} / ${active.sectionsMapped} drafted`}
          withRightRule
        />
        <StubColumn label="Live draft" hint="Drafting pane" withRightRule />
        <div style={{ minHeight: 0, overflow: "hidden" }}>
          <FeedPane />
        </div>
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  sub,
  danger,
}: {
  label: string;
  value: string;
  sub: string;
  danger?: boolean;
}) {
  return (
    <div style={{ textAlign: "right" }}>
      <div
        className="font-te-mono"
        style={{
          fontSize: 9.5,
          color: "var(--te-muted-soft)",
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        className="font-te-serif"
        style={{
          fontSize: 24,
          letterSpacing: -0.4,
          color: danger ? "var(--te-block)" : "var(--te-ink)",
          lineHeight: 1,
          marginTop: 2,
        }}
      >
        {value}
      </div>
      <div
        className="font-te-mono"
        style={{
          fontSize: 9.5,
          color: "var(--te-muted-soft)",
          marginTop: 3,
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function StubBlock({
  label,
  hint,
  minHeight,
  children,
}: {
  label: string;
  hint?: string;
  minHeight?: number;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight,
        border: "1px dashed var(--te-hairline)",
        borderRadius: 2,
        background: "var(--te-panel-alt)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        gap: 4,
        color: "var(--te-muted-soft)",
      }}
    >
      <Eyebrow>{label}</Eyebrow>
      {hint && (
        <div className="font-te-mono" style={{ fontSize: 10, color: "var(--te-muted-soft)" }}>
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}

function StubColumn({
  label,
  hint,
  withRightRule,
}: {
  label: string;
  hint: string;
  withRightRule?: boolean;
}) {
  return (
    <div
      style={{
        padding: 16,
        minHeight: 0,
        overflow: "auto",
        borderRight: withRightRule
          ? "1px solid var(--te-hairline-soft)"
          : undefined,
      }}
    >
      <div style={{ padding: "0 2px 8px" }}>
        <Eyebrow>{label}</Eyebrow>
      </div>
      <StubBlock label="Coming in next pass" hint={hint} minHeight={140} />
    </div>
  );
}
