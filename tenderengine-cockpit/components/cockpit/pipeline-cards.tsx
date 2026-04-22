"use client";

import type { CSSProperties } from "react";
import type { AgentId, AgentRun, AgentState } from "@/lib/types";
import { selectActiveAgents, useStore } from "@/lib/store";
import { Dot } from "@/components/primitives/dot";
import { Eyebrow } from "@/components/primitives/eyebrow";

export function PipelineCards() {
  const agents = useStore(selectActiveAgents);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 10,
      }}
    >
      {agents.map((a) => (
        <AgentCard key={a.id} agent={a} />
      ))}
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentRun }) {
  const startAgent = useStore((s) => s.startAgent);
  const cancelAgent = useStore((s) => s.cancelAgent);

  const tone = stateTone(agent.state);
  const busy = agent.state === "running" || agent.state === "queued";

  const onPrimary = () => {
    if (busy) {
      void cancelAgent(agent.id);
    } else {
      void startAgent(agent.id);
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${tone.border}`,
        borderRadius: 3,
        background: tone.background,
        padding: "12px 12px 10px",
        minHeight: 172,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="font-te-mono"
            style={{
              fontSize: 9.5,
              color: "var(--te-muted-soft)",
              letterSpacing: 1.4,
            }}
          >
            {agent.label}
          </span>
          <span
            className="font-te-sans"
            style={{
              fontSize: 13,
              color: "var(--te-ink)",
              fontWeight: 500,
            }}
          >
            {agent.name}
          </span>
        </div>
        <StateBadge state={agent.state} />
      </div>

      <div
        style={{
          fontSize: 11.5,
          color: "var(--te-muted)",
          lineHeight: 1.4,
          flex: 1,
        }}
      >
        {agent.role}
      </div>

      {agent.output ? (
        <div
          className="font-te-mono"
          style={{
            fontSize: 10,
            color: "var(--te-muted-soft)",
            borderTop: "1px solid var(--te-hairline-soft)",
            paddingTop: 6,
            lineHeight: 1.4,
            letterSpacing: 0.2,
          }}
        >
          {truncate(agent.output, 90)}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          marginTop: 2,
        }}
      >
        <button
          type="button"
          className="te-btn font-te-sans"
          onClick={onPrimary}
          style={primaryButtonStyle(agent.state)}
        >
          {primaryLabel(agent.state)}
        </button>
      </div>
    </div>
  );
}

function StateBadge({ state }: { state: AgentState }) {
  const { label, color } = badgeForState(state);
  return (
    <div
      className="font-te-mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 9.5,
        color: "var(--te-muted)",
        letterSpacing: 1.1,
        textTransform: "uppercase",
      }}
    >
      <Dot color={color} size={6} className={state === "running" ? "te-pulse" : undefined} />
      {label}
    </div>
  );
}

function badgeForState(state: AgentState): { label: string; color: string } {
  switch (state) {
    case "done":
      return { label: "done", color: "var(--te-good)" };
    case "running":
      return { label: "running", color: "var(--te-accent)" };
    case "queued":
      return { label: "queued", color: "var(--te-warn)" };
    case "error":
      return { label: "error", color: "var(--te-block)" };
    case "idle":
    default:
      return { label: "idle", color: "var(--te-muted-soft)" };
  }
}

function stateTone(state: AgentState): { border: string; background: string } {
  switch (state) {
    case "running":
      return {
        border: "var(--te-accent)",
        background: "var(--te-panel)",
      };
    case "done":
      return {
        border: "var(--te-hairline)",
        background: "var(--te-panel)",
      };
    case "error":
      return {
        border: "var(--te-block)",
        background: "var(--te-panel)",
      };
    case "queued":
    case "idle":
    default:
      return {
        border: "var(--te-hairline)",
        background: "var(--te-panel-alt)",
      };
  }
}

function primaryLabel(state: AgentState): string {
  switch (state) {
    case "running":
    case "queued":
      return "Cancel";
    case "done":
      return "Re-run";
    case "error":
      return "Retry";
    case "idle":
    default:
      return "Run";
  }
}

function primaryButtonStyle(state: AgentState): CSSProperties {
  const isBusy = state === "running" || state === "queued";
  return {
    padding: "5px 10px",
    borderRadius: 3,
    fontSize: 11,
    fontWeight: 500,
    background: isBusy ? "transparent" : "var(--te-invert-bg)",
    color: isBusy ? "var(--te-muted)" : "var(--te-invert-fg)",
    border: isBusy ? "1px solid var(--te-hairline)" : "1px solid transparent",
    letterSpacing: 0.2,
  };
}

function truncate(s: string | null | undefined, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export type { AgentId };
