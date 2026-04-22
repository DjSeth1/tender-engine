import type { CSSProperties } from "react";

interface DotProps {
  color?: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}

export function Dot({
  color = "var(--te-muted)",
  size = 6,
  style,
  className,
}: DotProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: size,
        background: color,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
