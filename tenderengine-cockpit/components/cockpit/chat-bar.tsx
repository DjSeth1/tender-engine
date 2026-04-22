"use client";

import type { KeyboardEvent } from "react";
import { useStore } from "@/lib/store";
import { Logomark } from "@/components/primitives/logomark";

export function ChatBar() {
  const input = useStore((s) => s.chat.input);
  const sending = useStore((s) => s.chat.sending);
  const setChatInput = useStore((s) => s.setChatInput);
  const submitChat = useStore((s) => s.submitChat);

  const disabled = sending || input.trim().length === 0;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) void submitChat();
    }
  };

  return (
    <div
      style={{
        gridColumn: "1 / span 2",
        height: 52,
        borderTop: "1px solid var(--te-hairline)",
        background: "var(--te-panel)",
        display: "flex",
        alignItems: "center",
        padding: "0 22px",
        gap: 14,
      }}
    >
      <div
        className="font-te-mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "var(--te-muted)",
          fontSize: 11,
          letterSpacing: 0.3,
        }}
      >
        <Logomark size={14} color="var(--te-muted)" />
        <span>▸</span>
      </div>
      <input
        value={input}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={sending}
        placeholder={
          sending
            ? "Dispatching…"
            : 'Tell TenderEngine what to do — "run triage on T26/10", "re-run drafting", "polish", "cancel"'
        }
        className="font-te-sans"
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          fontSize: 13.5,
          color: "var(--te-ink)",
        }}
      />
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span
          className="font-te-mono"
          style={{
            fontSize: 10,
            color: "var(--te-muted-soft)",
            letterSpacing: 0.4,
          }}
        >
          ⌘K palette
        </span>
        <span style={{ width: 1, height: 16, background: "var(--te-hairline)" }} />
        <button
          type="button"
          className="te-btn font-te-sans"
          onClick={() => void submitChat()}
          disabled={disabled}
          style={{
            padding: "5px 12px",
            borderRadius: 3,
            background: disabled ? "var(--te-pill-bg)" : "var(--te-accent)",
            color: disabled ? "var(--te-muted)" : "#fff",
            fontSize: 12,
            fontWeight: 500,
            cursor: disabled ? "default" : "pointer",
          }}
        >
          {sending ? "…" : "Send ⏎"}
        </button>
      </div>
    </div>
  );
}
