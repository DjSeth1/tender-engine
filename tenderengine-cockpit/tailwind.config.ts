import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx,mdx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "te-bg": "var(--te-bg)",
        "te-panel": "var(--te-panel)",
        "te-panel-alt": "var(--te-panel-alt)",
        "te-ink": "var(--te-ink)",
        "te-ink-2": "var(--te-ink-2)",
        "te-muted": "var(--te-muted)",
        "te-muted-soft": "var(--te-muted-soft)",
        "te-hairline": "var(--te-hairline)",
        "te-hairline-soft": "var(--te-hairline-soft)",
        "te-accent": "var(--te-accent)",
        "te-accent-soft": "var(--te-accent-soft)",
        "te-accent-ink": "var(--te-accent-ink)",
        "te-good": "var(--te-good)",
        "te-good-soft": "var(--te-good-soft)",
        "te-good-ink": "var(--te-good-ink)",
        "te-warn": "var(--te-warn)",
        "te-warn-soft": "var(--te-warn-soft)",
        "te-warn-ink": "var(--te-warn-ink)",
        "te-block": "var(--te-block)",
        "te-block-soft": "var(--te-block-soft)",
        "te-block-ink": "var(--te-block-ink)",
        "te-placeholder": "var(--te-placeholder)",
        "te-placeholder-soft": "var(--te-placeholder-soft)",
        "te-placeholder-ink": "var(--te-placeholder-ink)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Instrument Serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "monospace"],
      },
      borderRadius: {
        "te-sharp": "2px",
        "te-btn": "3px",
        "te-card": "4px",
      },
    },
  },
  plugins: [],
};
export default config;
