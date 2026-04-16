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
        background: "#0a0f1c",
        surface: "#111827",
        border: "#2b3648",
        accent: "#38bdf8",
        "accent-dim": "#0284c7",
        "text-primary": "#f8fafc",
        "text-secondary": "#cbd5e1",
        "text-muted": "#94a3b8",
        success: "#10b981",
        info: "#06b6d4",
        purple: "#6366f1",
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
