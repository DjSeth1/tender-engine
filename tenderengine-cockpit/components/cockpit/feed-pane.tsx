"use client";

import { useEffect, useRef } from "react";
import type { FeedEvent, FeedLevel } from "@/lib/types";
import { selectActiveEvents, useStore } from "@/lib/store";
import { Eyebrow } from "@/components/primitives/eyebrow";

export function FeedPane() {
  const events = useStore(selectActiveEvents);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Feed is newest-first, so scroll to the top on new events.
    if (ref.current) ref.current.scrollTop = 0;
  }, [events.length]);

  return (
    <div
      style={{
        padding: 16,
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "0 2px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Eyebrow>Agent feed</Eyebrow>
        <span
          className="font-te-mono"
          style={{
            fontSize: 9.5,
            color: "var(--te-muted-soft)",
            letterSpacing: 0.8,
          }}
        >
          {events.length} event{events.length === 1 ? "" : "s"}
        </span>
      </div>
      <div
        ref={ref}
        style={{
          overflow: "auto",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          paddingRight: 2,
        }}
      >
        {events.length === 0 ? (
          <div
            className="font-te-mono"
            style={{
              fontSize: 10.5,
              color: "var(--te-muted-soft)",
              padding: "18px 4px",
              letterSpacing: 0.3,
            }}
          >
            No agent events yet. Start an agent or type a command in the chat
            bar.
          </div>
        ) : (
          events.map((e, i) => <FeedRow key={`${e.t}-${i}`} e={e} />)
        )}
      </div>
    </div>
  );
}

function FeedRow({ e }: { e: FeedEvent }) {
  return (
    <div
      className="te-in"
      style={{
        display: "grid",
        gridTemplateColumns: "58px 1fr",
        gap: 8,
        fontSize: 11,
        lineHeight: 1.5,
      }}
    >
      <span
        className="font-te-mono"
        style={{
          color: "var(--te-muted-soft)",
          letterSpacing: 0.2,
          fontSize: 10.5,
          paddingTop: 0.5,
        }}
      >
        {e.t}
      </span>
      <div style={{ minWidth: 0 }}>
        {e.agent ? (
          <span
            className="font-te-mono"
            style={{
              color: "var(--te-muted)",
              fontSize: 10,
              letterSpacing: 0.3,
              marginRight: 6,
              textTransform: "uppercase",
            }}
          >
            {e.agent}
          </span>
        ) : null}
        <span
          style={{
            color: levelColor(e.level),
            wordBreak: "break-word",
          }}
        >
          {e.message}
        </span>
      </div>
    </div>
  );
}

function levelColor(level: FeedLevel): string {
  switch (level) {
    case "warn":
      return "var(--te-warn-ink)";
    case "error":
      return "var(--te-block)";
    case "done":
      return "var(--te-good-ink)";
    case "info":
    default:
      return "var(--te-ink-2)";
  }
}
