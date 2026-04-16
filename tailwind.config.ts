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
        background: "#070b14",
        surface: "#101828",
        border: "#334155",
        accent: "#22d3ee",
        "accent-dim": "#0891b2",
        "text-primary": "#f1f5f9",
        "text-secondary": "#cbd5e1",
        "text-muted": "#94a3b8",
        success: "#10b981",
        info: "#06b6d4",
        purple: "#8b5cf6",
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
