"use client";

import { useStore } from "@/lib/store";
import { Dot } from "@/components/primitives/dot";
import { Eyebrow } from "@/components/primitives/eyebrow";
import {
  daysUntil,
  formatDaysLeft,
  statusDotColor,
} from "@/lib/utils";

const RAIL_WIDTH = 248;

const railStartBtn: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "8px 10px",
  borderRadius: 3,
  background: "transparent",
  border: "1px dashed var(--te-hairline)",
  color: "var(--te-muted)",
  fontSize: 12,
};

export function TendersRail() {
  const tenders = useStore((s) => s.tenders);
  const activeTenderId = useStore((s) => s.activeTenderId);
  const setActiveTenderId = useStore((s) => s.setActiveTenderId);

  return (
    <div
      style={{
        width: RAIL_WIDTH,
        borderRight: "1px solid var(--te-hairline)",
        overflow: "auto",
        background: "var(--te-bg)",
      }}
    >
      <div
        style={{
          padding: "16px 18px 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Eyebrow>Tenders</Eyebrow>
        <span
          className="font-te-mono"
          style={{ fontSize: 10, color: "var(--te-muted-soft)" }}
        >
          {tenders.length}
        </span>
      </div>

      {tenders.map((t) => {
        const active = t.id === activeTenderId;
        const color = statusDotColor(t.status, t.result);
        const days = daysUntil(t.deadline);
        const daysLabel = formatDaysLeft(days, t.status, t.result);
        const daysIsUrgent =
          days !== null && days >= 0 && days <= 2 &&
          t.status !== "Submitted" &&
          t.status !== "Not Doing" &&
          t.result !== "Won" &&
          t.result !== "Lost";

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTenderId(t.id)}
            className="te-btn te-row"
            style={{
              width: "100%",
              textAlign: "left",
              padding: "9px 18px",
              cursor: "pointer",
              background: active ? "var(--te-hover)" : "transparent",
              borderLeft: `2px solid ${active ? "var(--te-accent)" : "transparent"}`,
              display: "block",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 3,
              }}
            >
              <Dot color={color} />
              <span
                className="font-te-mono"
                style={{
                  fontSize: 9.5,
                  color: "var(--te-muted-soft)",
                  letterSpacing: 0.3,
                }}
              >
                {t.reference}
              </span>
            </div>
            <div
              style={{
                fontSize: 12.5,
                lineHeight: 1.3,
                color: "var(--te-ink)",
                fontWeight: active ? 500 : 400,
                marginBottom: 3,
              }}
            >
              {t.name}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10.5,
                color: "var(--te-muted)",
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 140,
                }}
              >
                {t.clientName}
              </span>
              <span
                className="font-te-mono"
                style={{
                  color: daysIsUrgent ? "var(--te-block)" : "var(--te-muted)",
                }}
              >
                {daysLabel}
              </span>
            </div>
          </button>
        );
      })}

      <div style={{ padding: 18, marginTop: 6 }}>
        <button type="button" className="te-btn te-row" style={railStartBtn}>
          + Start a tender
        </button>
        <button
          type="button"
          className="te-btn te-row"
          style={{ ...railStartBtn, marginTop: 6 }}
        >
          + Onboard a client
        </button>
      </div>
    </div>
  );
}
