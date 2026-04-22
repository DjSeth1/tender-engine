import type { ReactNode } from "react";

export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span
      className="font-te-mono"
      style={{
        background: "var(--te-placeholder-soft)",
        color: "var(--te-placeholder-ink)",
        padding: "1px 5px",
        borderRadius: 2,
        fontSize: 11,
        letterSpacing: 0.2,
        borderBottom: "1px dashed var(--te-placeholder)",
      }}
    >
      {children}
    </span>
  );
}
