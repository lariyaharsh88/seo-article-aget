"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = localStorage.getItem("rfh:theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      applyTheme(stored);
      return;
    }
    const initial: ThemeMode = "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(nextTheme);
        localStorage.setItem("rfh:theme", nextTheme);
        applyTheme(nextTheme);
      }}
      className="rounded-lg border border-border/80 bg-surface/45 h-9 w-9 text-sm text-text-secondary hover:border-accent hover:text-text-primary"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <span aria-hidden>{theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
