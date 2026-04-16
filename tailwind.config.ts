import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#05070f",
        surface: "#0b1020",
        border: "#1e293b",
        accent: "#38bdf8",
        "accent-dim": "#0e7490",
        "text-primary": "#e2e8f0",
        "text-secondary": "#94a3b8",
        "text-muted": "#64748b",
        success: "#10b981",
        info: "#06b6d4",
        purple: "#a78bfa",
      },
      fontFamily: {
        display: ["var(--font-inter)", "Inter", "sans-serif"],
        serif: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
