import type { CSSProperties } from "react";

interface RuleProps {
  soft?: boolean;
  vertical?: boolean;
  style?: CSSProperties;
}

export function Rule({ soft, vertical, style }: RuleProps) {
  const color = soft ? "var(--te-hairline-soft)" : "var(--te-hairline)";
  return (
    <div
      style={{
        background: color,
        height: vertical ? "100%" : 1,
        width: vertical ? 1 : "auto",
        ...style,
      }}
    />
  );
}
