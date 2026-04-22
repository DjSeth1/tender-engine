"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/**
 * Hydrates the persisted theme from localStorage and keeps the
 * `data-theme` attribute on <html> in sync with the store.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("te-theme");
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      /* localStorage unavailable (SSR/private mode) — ignore */
    }
  }, [setTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("te-theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return <>{children}</>;
}
