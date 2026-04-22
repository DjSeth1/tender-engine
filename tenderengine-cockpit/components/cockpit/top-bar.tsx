"use client";

import { useStore } from "@/lib/store";
import { Wordmark } from "@/components/primitives/wordmark";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS: { label: string; active: boolean }[] = [
  { label: "Pipeline", active: true },
  { label: "Tenders", active: false },
  { label: "Clients", active: false },
  { label: "Library", active: false },
];

export function TopBar() {
  const user = useStore((s) => s.user);
  const openNewTender = useStore((s) => s.openNewTender);

  return (
    <div
      style={{
        gridColumn: "1 / span 2",
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        borderBottom: "1px solid var(--te-hairline)",
        justifyContent: "space-between",
        background: "var(--te-bg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Wordmark size={18} />
        <nav
          style={{
            display: "flex",
            gap: 22,
            alignItems: "center",
            color: "var(--te-muted)",
            fontSize: 13,
          }}
        >
          {NAV_ITEMS.map((item) => (
            <span
              key={item.label}
              style={{
                color: item.active ? "var(--te-ink)" : undefined,
                fontWeight: item.active ? 500 : 400,
                cursor: item.active ? "default" : "pointer",
              }}
            >
              {item.label}
            </span>
          ))}
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={openNewTender}
          className="te-btn font-te-sans"
          style={{
            padding: "7px 14px",
            borderRadius: 3,
            background: "var(--te-accent)",
            color: "#fff",
            fontSize: 12.5,
            fontWeight: 500,
          }}
        >
          + New tender
        </button>
        <button
          type="button"
          className="te-btn font-te-sans"
          style={{
            padding: "7px 14px",
            borderRadius: 3,
            background: "var(--te-panel)",
            color: "var(--te-ink)",
            border: "1px solid var(--te-hairline)",
            fontSize: 12.5,
            fontWeight: 500,
          }}
        >
          + New client
        </button>

        <div
          style={{
            width: 1,
            height: 22,
            background: "var(--te-hairline)",
            margin: "0 6px",
          }}
        />

        <ThemeToggle />

        <div
          title={user.name}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            background: "var(--te-ink)",
            color: "var(--te-bg)",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          {user.initials}
        </div>
      </div>
    </div>
  );
}
