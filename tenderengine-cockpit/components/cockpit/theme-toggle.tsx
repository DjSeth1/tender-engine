"use client";

import { useStore } from "@/lib/store";

export function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="te-btn font-te-mono"
      style={{
        width: 28,
        height: 28,
        display: "grid",
        placeItems: "center",
        borderRadius: 3,
        border: "1px solid var(--te-hairline)",
        color: "var(--te-muted)",
        fontSize: 12,
        background: "transparent",
      }}
    >
      {isDark ? "☾" : "☀"}
    </button>
  );
}
