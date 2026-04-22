import { Logomark } from "./logomark";

interface WordmarkProps {
  size?: number;
  color?: string;
}

export function Wordmark({ size = 20, color = "var(--te-ink)" }: WordmarkProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 10,
        color,
      }}
    >
      <Logomark size={size} color={color} />
      <div
        className="font-te-serif"
        style={{
          fontSize: size * 1.05,
          letterSpacing: -0.3,
          lineHeight: 1,
          fontWeight: 400,
        }}
      >
        Tender<span style={{ fontStyle: "italic", opacity: 0.8 }}>Engine</span>
      </div>
    </div>
  );
}
