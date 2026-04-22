import type { CSSProperties, ReactNode } from "react";

type Variant = "neutral" | "accent" | "good" | "warn" | "block" | "mono";

interface PillProps {
  children: ReactNode;
  variant?: Variant;
  style?: CSSProperties;
}

const VARIANT_MAP: Record<Variant, { bg: string; fg: string }> = {
  neutral: { bg: "var(--te-pill-bg)", fg: "var(--te-ink-2)" },
  accent: { bg: "var(--te-accent-soft)", fg: "var(--te-accent-ink)" },
  good: { bg: "var(--te-good-soft)", fg: "var(--te-good-ink)" },
  warn: { bg: "var(--te-warn-soft)", fg: "var(--te-warn-ink)" },
  block: { bg: "var(--te-block-soft)", fg: "var(--te-block-ink)" },
  mono: { bg: "var(--te-invert-bg)", fg: "var(--te-invert-fg)" },
};

export function Pill({ children, variant = "neutral", style }: PillProps) {
  const c = VARIANT_MAP[variant];
  return (
    <span
      className="font-te-mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: c.bg,
        color: c.fg,
        fontSize: 10,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        fontWeight: 500,
        padding: "3px 7px",
        borderRadius: 3,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
