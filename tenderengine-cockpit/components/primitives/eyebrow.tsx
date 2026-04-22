import type { CSSProperties, ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}

export function Eyebrow({ children, color, style }: EyebrowProps) {
  return (
    <div
      className="font-te-mono"
      style={{
        fontSize: 10,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: color ?? "var(--te-muted-soft)",
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
