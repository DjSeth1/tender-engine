interface LogomarkProps {
  size?: number;
  color?: string;
}

export function Logomark({ size = 20, color = "var(--te-ink)" }: LogomarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10.5" stroke={color} strokeWidth="1" />
      <path
        d="M7 8h10M12 8v9M9 17h6"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="square"
      />
      <circle cx="12" cy="12" r="1.5" fill={color} />
    </svg>
  );
}
